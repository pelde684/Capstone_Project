import {
  CheckCircle,
  XCircle,
  User,
  Package,
} from "lucide-react";

function VerificationCard({
  item,
  onApprove,
  onReject,
}) {

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="p-6">

        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3">

            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" />
            </div>

            <div>
              <h3 className="font-bold text-lg">
                {item.itemName}
              </h3>

              <p className="text-sm text-slate-500">
                QR ID: {item.qrCode}
              </p>
            </div>

          </div>

          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            Pending
          </span>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div>

            <p className="text-sm text-slate-500 mb-2">
              Student
            </p>

            <div className="flex items-center gap-2">
              <User size={18} />
              <span className="font-medium">
                {item.studentName}
              </span>
            </div>

          </div>

          <div>

            <p className="text-sm text-slate-500 mb-2">
              Student ID
            </p>

            <p className="font-medium">
              {item.studentId}
            </p>

          </div>

        </div>

        <div className="mt-6">

          <p className="text-sm text-slate-500 mb-2">
            Description
          </p>

          <p className="text-sm bg-slate-50 p-4 rounded-lg">
            {item.description}
          </p>

        </div>

      </div>

      <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">

        <button
          onClick={() => onReject(item)}
          className="flex items-center gap-2 px-5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
        >
          <XCircle size={18} />
          Reject
        </button>

        <button
          onClick={() => onApprove(item)}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          <CheckCircle size={18} />
          Approve
        </button>

      </div>

    </div>
  );
}

export default VerificationCard;