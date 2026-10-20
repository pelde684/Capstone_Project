import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Package, Eye } from "lucide-react";

const belongings = [
  {
    id: "LUG-001",
    name: "Black Suitcase",
    category: "Suitcase",
    color: "Black",
    status: "Verified",
  },
  {
    id: "LUG-002",
    name: "Blue Backpack",
    category: "Backpack",
    color: "Blue",
    status: "Pending",
  },
  {
    id: "LUG-003",
    name: "Small Travel Bag",
    category: "Bag",
    color: "Grey",
    status: "Handed Over",
  },
];

export default function MyBelongings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="bg-white/95 border-b px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Belongings</h1>

            <p className="text-slate-300">
              View your registered luggage and QR codes.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto"
          >
            + Register Luggage
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {belongings.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="h-40 bg-slate-200 flex items-center justify-center">
                <Package size={55} className="text-slate-400" />
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-lg">{item.name}</h2>

                    <p className="text-sm text-slate-500">{item.id}</p>
                  </div>

                  <span className="text-3xl">▦</span>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    <strong>Category:</strong> {item.category}
                  </p>

                  <p>
                    <strong>Color:</strong> {item.color}
                  </p>
                </div>

                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "Verified"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={() => navigate(`/student/qr/${item.id}`)}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
                  >
                    <QrCode size={17} />
                    QR Code
                  </button>

                  <button className="flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 py-2 rounded-lg transition">
                    <Eye size={17} />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}