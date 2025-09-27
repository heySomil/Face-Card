export default function Footer() {
  return (
    <div className="absolute w-full py-5 text-center">
      <p className="text-gray-500">
        PayWiser - The Future of Biometric Payments
      </p>
      <p className="text-xs text-gray-400 mt-1">
        © {new Date().getFullYear()} PayWiser. All rights reserved.
      </p>
    </div>
  );
}