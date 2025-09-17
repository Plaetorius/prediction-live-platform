export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="shadow-lg bg-white rounded-2xl p-8 text-center border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Loading...</p>
      </div>
    </main>
  );
}