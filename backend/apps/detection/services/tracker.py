"""
SF-SORT (Simple Fast SORT) Tracker Implementation
Based on SORT algorithm with improvements for PPE detection
"""
import numpy as np
from scipy.optimize import linear_sum_assignment
from filterpy.kalman import KalmanFilter


def iou_batch(bboxes1, bboxes2):
    """
    Compute IoU between two sets of bounding boxes
    
    Args:
        bboxes1: numpy array of shape (N, 4) in format [x1, y1, x2, y2]
        bboxes2: numpy array of shape (M, 4) in format [x1, y1, x2, y2]
    
    Returns:
        numpy array of shape (N, M) containing IoU values
    """
    if len(bboxes1) == 0 or len(bboxes2) == 0:
        return np.zeros((len(bboxes1), len(bboxes2)))
    
    bboxes1 = np.expand_dims(bboxes1, 1)  # (N, 1, 4)
    bboxes2 = np.expand_dims(bboxes2, 0)  # (1, M, 4)
    
    # Calculate intersection
    xx1 = np.maximum(bboxes1[..., 0], bboxes2[..., 0])
    yy1 = np.maximum(bboxes1[..., 1], bboxes2[..., 1])
    xx2 = np.minimum(bboxes1[..., 2], bboxes2[..., 2])
    yy2 = np.minimum(bboxes1[..., 3], bboxes2[..., 3])
    
    w = np.maximum(0., xx2 - xx1)
    h = np.maximum(0., yy2 - yy1)
    intersection = w * h
    
    # Calculate union
    area1 = (bboxes1[..., 2] - bboxes1[..., 0]) * (bboxes1[..., 3] - bboxes1[..., 1])
    area2 = (bboxes2[..., 2] - bboxes2[..., 0]) * (bboxes2[..., 3] - bboxes2[..., 1])
    union = area1 + area2 - intersection
    
    iou = intersection / np.maximum(union, 1e-6)
    
    return iou


class KalmanBoxTracker:
    """
    Kalman Filter untuk tracking bounding box
    State: [x_center, y_center, area, aspect_ratio, dx, dy, da, dar]
    """
    count = 0  # Global counter untuk unique IDs
    
    def __init__(self, bbox, class_id, class_name, confidence):
        """
        Initialize tracker dengan bounding box pertama
        
        Args:
            bbox: [x1, y1, x2, y2]
            class_id: ID class object
            class_name: Nama class object
            confidence: Confidence score
        """
        # Initialize Kalman Filter
        self.kf = KalmanFilter(dim_x=8, dim_z=4)
        
        # State transition matrix (constant velocity model)
        self.kf.F = np.array([
            [1, 0, 0, 0, 1, 0, 0, 0],  # x = x + dx
            [0, 1, 0, 0, 0, 1, 0, 0],  # y = y + dy
            [0, 0, 1, 0, 0, 0, 1, 0],  # a = a + da
            [0, 0, 0, 1, 0, 0, 0, 1],  # r = r + dr
            [0, 0, 0, 0, 1, 0, 0, 0],  # dx = dx
            [0, 0, 0, 0, 0, 1, 0, 0],  # dy = dy
            [0, 0, 0, 0, 0, 0, 1, 0],  # da = da
            [0, 0, 0, 0, 0, 0, 0, 1],  # dr = dr
        ])
        
        # Measurement matrix
        self.kf.H = np.array([
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
        ])
        
        # Measurement noise
        self.kf.R *= 10.0
        
        # Process noise
        self.kf.P[4:, 4:] *= 1000.0  # High uncertainty for velocity
        self.kf.P *= 10.0
        
        self.kf.Q[-1, -1] *= 0.01
        self.kf.Q[4:, 4:] *= 0.01
        
        # Initialize state
        self.kf.x[:4] = self._convert_bbox_to_z(bbox)
        
        # Tracker properties
        self.id = KalmanBoxTracker.count
        KalmanBoxTracker.count += 1
        
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        
        self.time_since_update = 0
        self.hits = 1
        self.hit_streak = 1
        self.age = 0
        
        self.history = []
    
    def _convert_bbox_to_z(self, bbox):
        """
        Convert [x1, y1, x2, y2] to [x_center, y_center, area, aspect_ratio]
        """
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = bbox[0] + w / 2.0
        y = bbox[1] + h / 2.0
        area = w * h
        aspect_ratio = w / float(h) if h != 0 else 1.0
        return np.array([x, y, area, aspect_ratio]).reshape((4, 1))
    
    def _convert_x_to_bbox(self, x):
        """
        Convert [x_center, y_center, area, aspect_ratio] to [x1, y1, x2, y2]
        """
        w = np.sqrt(x[2] * x[3])
        h = x[2] / w if w != 0 else 1.0
        x1 = x[0] - w / 2.0
        y1 = x[1] - h / 2.0
        x2 = x[0] + w / 2.0
        y2 = x[1] + h / 2.0
        return np.array([x1, y1, x2, y2]).flatten()
    
    def update(self, bbox, class_id, class_name, confidence):
        """
        Update tracker dengan new detection
        """
        self.time_since_update = 0
        self.hits += 1
        self.hit_streak += 1
        
        # Update class info (bisa berubah karena confidence)
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        
        # Kalman update
        self.kf.update(self._convert_bbox_to_z(bbox))
    
    def predict(self):
        """
        Predict next state
        """
        # Prevent area from becoming negative
        if self.kf.x[2] + self.kf.x[6] <= 0:
            self.kf.x[6] = 0
        
        self.kf.predict()
        self.age += 1
        
        if self.time_since_update > 0:
            self.hit_streak = 0
        
        self.time_since_update += 1
        
        bbox = self._convert_x_to_bbox(self.kf.x)
        self.history.append(bbox)
        
        return bbox
    
    def get_state(self):
        """
        Get current bounding box
        """
        return self._convert_x_to_bbox(self.kf.x)


class SFSORTTracker:
    """
    SF-SORT (Simple Fast SORT) Tracker
    Multi-object tracker using Kalman Filter and Hungarian algorithm
    """
    
    def __init__(self, max_age=30, min_hits=3, iou_threshold=0.3):
        """
        Initialize SF-SORT tracker
        
        Args:
            max_age: Maximum frames to keep alive a track without detections
            min_hits: Minimum hits before a track is confirmed
            iou_threshold: Minimum IoU for matching detection to track
        """
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        
        self.trackers = []
        self.frame_count = 0
        
        # Statistics
        self.unique_ids_seen = set()
        self.active_ids = set()
    
    def update(self, detections):
        """
        Update tracker dengan new detections
        
        Args:
            detections: List of dicts with keys:
                - bbox: [x1, y1, x2, y2]
                - class_id: int
                - class_name: str
                - confidence: float
        
        Returns:
            List of tracked objects with keys:
                - bbox: [x1, y1, x2, y2]
                - track_id: int (unique persistent ID)
                - class_id: int
                - class_name: str
                - confidence: float
        """
        self.frame_count += 1
        
        # Predict new locations for existing trackers
        trks = np.zeros((len(self.trackers), 4))
        to_del = []
        
        for t, trk in enumerate(trks):
            pos = self.trackers[t].predict()
            trk[:] = pos
            if np.any(np.isnan(pos)):
                to_del.append(t)
        
        # Remove invalid trackers
        for t in reversed(to_del):
            self.trackers.pop(t)
        
        trks = np.ma.compress_rows(np.ma.masked_invalid(trks))
        
        # Match detections to trackers
        if len(detections) > 0:
            dets = np.array([d['bbox'] for d in detections])
            matched, unmatched_dets, unmatched_trks = self._associate_detections_to_trackers(
                dets, trks, self.iou_threshold
            )
            
            # Update matched trackers
            for m in matched:
                det_idx, trk_idx = m[0], m[1]
                self.trackers[trk_idx].update(
                    detections[det_idx]['bbox'],
                    detections[det_idx]['class_id'],
                    detections[det_idx]['class_name'],
                    detections[det_idx]['confidence']
                )
            
            # Create new trackers for unmatched detections
            for i in unmatched_dets:
                trk = KalmanBoxTracker(
                    detections[i]['bbox'],
                    detections[i]['class_id'],
                    detections[i]['class_name'],
                    detections[i]['confidence']
                )
                self.trackers.append(trk)
        
        # Remove dead trackers
        i = len(self.trackers)
        ret = []
        
        for trk in reversed(self.trackers):
            d = trk.get_state()
            
            # Only return tracks that have been hit enough times
            if trk.time_since_update < 1 and (trk.hit_streak >= self.min_hits or self.frame_count <= self.min_hits):
                ret.append({
                    'bbox': d.tolist(),
                    'track_id': trk.id,
                    'class_id': trk.class_id,
                    'class_name': trk.class_name,
                    'confidence': trk.confidence,
                    'hits': trk.hits,
                    'age': trk.age
                })
                
                # Track statistics
                self.unique_ids_seen.add(trk.id)
                self.active_ids.add(trk.id)
            
            i -= 1
            
            # Remove dead tracks
            if trk.time_since_update > self.max_age:
                self.trackers.pop(i)
                if trk.id in self.active_ids:
                    self.active_ids.remove(trk.id)
        
        return ret
    
    def _associate_detections_to_trackers(self, detections, trackers, iou_threshold=0.3):
        """
        Associate detections to tracked objects using Hungarian algorithm
        
        Returns:
            matched: array of [detection_idx, tracker_idx]
            unmatched_detections: array of detection indices
            unmatched_trackers: array of tracker indices
        """
        if len(trackers) == 0:
            return np.empty((0, 2), dtype=int), np.arange(len(detections)), np.empty((0,), dtype=int)
        
        # Compute IoU matrix
        iou_matrix = iou_batch(detections, trackers)
        
        # Use Hungarian algorithm for optimal assignment
        if min(iou_matrix.shape) > 0:
            # Convert to cost matrix (1 - IoU)
            cost_matrix = 1 - iou_matrix
            
            # Hungarian algorithm
            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            matched_indices = np.column_stack((row_ind, col_ind))
        else:
            matched_indices = np.empty((0, 2), dtype=int)
        
        # Filter matches by IoU threshold
        matches = []
        for m in matched_indices:
            if iou_matrix[m[0], m[1]] < iou_threshold:
                continue
            matches.append(m.reshape(1, 2))
        
        if len(matches) == 0:
            matches = np.empty((0, 2), dtype=int)
        else:
            matches = np.concatenate(matches, axis=0)
        
        # Find unmatched detections and trackers
        unmatched_detections = []
        for d in range(len(detections)):
            if d not in matches[:, 0]:
                unmatched_detections.append(d)
        
        unmatched_trackers = []
        for t in range(len(trackers)):
            if t not in matches[:, 1]:
                unmatched_trackers.append(t)
        
        return matches, np.array(unmatched_detections), np.array(unmatched_trackers)
    
    def get_statistics(self):
        """
        Get tracking statistics
        """
        return {
            'total_unique_objects': len(self.unique_ids_seen),
            'active_tracks': len(self.active_ids),
            'frame_count': self.frame_count
        }
    
    def reset(self):
        """
        Reset tracker (untuk new video/session)
        """
        self.trackers = []
        self.frame_count = 0
        self.unique_ids_seen = set()
        self.active_ids = set()
        KalmanBoxTracker.count = 0
