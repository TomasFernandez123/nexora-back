import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.config';

export const multerUserConfig = {
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      return {
        folder: 'nexora/users',
        format: file.mimetype.split('/')[1],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, 
      };
    },
  }),
};

export const multerPostConfig = {
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      return {
        folder: 'nexora/posts',
        format: file.mimetype.split('/')[1],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, 
      };
    },
  }),
};
