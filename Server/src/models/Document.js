import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true // the Cloudinary/S3 URL
  },
  fileType: {
    type: String, // e.g. 'pdf'
    default: 'pdf'
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'failed'],
    default: 'uploaded'
  },
  extractedText: {
    type: String, // filled in later once you build text extraction
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);