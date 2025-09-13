// TODO update colors
export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="neo-shadow bg-white rounded-2xl p-8 text-center border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff331f] mx-auto mb-4"></div>
        <p className="text-[#0d0106] text-lg font-medium">Loading...</p>
      </div>
    </main>
  );
}