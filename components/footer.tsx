export default function Footer() {
  return (
    <footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
      <p>
        &copy; {new Date().getFullYear()} My Website. All rights reserved.
      </p>
    </footer>
  );
}