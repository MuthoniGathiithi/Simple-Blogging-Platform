"""
Face detection using InsightFace.
"""
import cv2
import numpy as np
from .face_model import get_face_model

def detect_faces(image):
    """
    Detect faces in an image using InsightFace.
    
    Args:
        image: numpy array (BGR format from OpenCV)
        
    Returns:
        list of face objects with bbox, kps, embedding, etc.
    """
    model = get_face_model()
    
    # InsightFace expects BGR format
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    
    # Detect faces
    faces = model.get(image)
    
    return faces

def detect_faces_from_base64(base64_string):
    """
    Detect faces from a base64 encoded image string.
    
    Args:
        base64_string: Base64 encoded image
        
    Returns:
        list of face objects
    """
    import base64
    from PIL import Image
    import io
    
    # Decode base64
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    
    # Convert to numpy array (BGR for OpenCV)
    image_array = np.array(image)
    if len(image_array.shape) == 3:
        # Convert RGB to BGR
        image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
    
    return detect_faces(image_array)

def get_face_bbox(faces):
    """
    Extract bounding boxes from InsightFace face objects.
    
    Args:
        faces: list of face objects from InsightFace
        
    Returns:
        list of bboxes in (x1, y1, x2, y2) format
    """
    bboxes = []
    for face in faces:
        bbox = face.bbox.astype(int)
        bboxes.append((bbox[0], bbox[1], bbox[2], bbox[3]))
    return bboxes

def get_face_landmarks(faces):
    """
    Get facial landmarks (keypoints) from InsightFace face objects.
    
    Args:
        faces: list of face objects from InsightFace
        
    Returns:
        list of landmark arrays (5 points: left_eye, right_eye, nose, left_mouth, right_mouth)
    """
    landmarks = []
    for face in faces:
        if hasattr(face, 'kps'):
            landmarks.append(face.kps)
        else:
            landmarks.append(None)
    return landmarks
