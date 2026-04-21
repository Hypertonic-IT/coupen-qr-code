# QR Code Coupon Management System

## Prerequisites
- Node.js (v20+)
- MongoDB (Running locally or on Atlas)
- Cloudinary Account (for image storage)

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `.env` file with your credentials:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `ADMIN_PASSWORD`: Default password for the 'admin' user

4. Start the backend server:
   ```bash
   npm start
   ```
   (Or `npm run dev` if nodemon is configured)

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Usage
- **Admin Portal**: Access at `http://localhost:5173/admin/login`
  - Default credentials: `admin` / `admin123` (or whatever you set in .env)
- **Claim Rewards**: Users access specific QR links like `http://localhost:5173/coupon/{uuid}`

## Key Features
- **Bulk QR Generation**: Create multiple unique coupons with specific values.
- **Print Layout**: A4-ready layout for physical coupon printing.
- **Admin Dashboard**: Manage submissions, approve/reject claims, and track payments.
- **CSV Export**: Export all user submission data.
- **Secure Storage**: Official QR images are stored in Cloudinary.
