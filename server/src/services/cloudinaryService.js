import { requireCloudinary } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

function uploadPdf(file, folder, publicId) {
  const cloudinary = requireCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder, public_id: publicId, format: 'pdf', use_filename: false },
      (error, result) => error ? reject(error) : resolve({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
      }),
    );
    stream.end(file.buffer);
  });
}

export async function deleteCloudinaryDocument(publicId) {
  if (!publicId) return;
  const cloudinary = requireCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
}

export async function uploadApplicationDocuments({ cv, coverLetter, applicantId, jobId }) {
  const folder = `departure-job-portal/applications/${applicantId}/${jobId}`;
  const stamp = Date.now();
  const results = await Promise.allSettled([
    uploadPdf(cv, folder, `cv-${stamp}`),
    uploadPdf(coverLetter, folder, `cover-letter-${stamp}`),
  ]);
  const successful = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (results.some((result) => result.status === 'rejected')) {
    await Promise.allSettled(successful.map((document) => deleteCloudinaryDocument(document.publicId)));
    const cause = results.find((result) => result.status === 'rejected').reason;
    if (cause instanceof AppError) throw cause;
    throw new AppError('The application documents could not be uploaded', 502);
  }
  return { cv: results[0].value, coverLetter: results[1].value };
}
