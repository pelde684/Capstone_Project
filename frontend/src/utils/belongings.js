// Backend status -> the labels (and card colours) the My Belongings page already uses
export const STATUS_LABEL = {
  REGISTERED: "Pending Verification",
  DEPOSITED: "Pending Verification",
  STORED: "Stored",
  READY_FOR_COLLECTION: "Stored",
  COLLECTED: "Returned",
  CANCELLED: "Not Registered",
};

// Short, readable code shown next to the QR (the QR itself holds the full value)
export const shortCode = (qrValue) => (qrValue ? qrValue.slice(0, 8).toUpperCase() : "");

// Turns the API's drop-offs into the flat item list the pages use
export function flattenDropOffs(dropOffs) {
  return dropOffs.flatMap((d) =>
    d.items.map((it) => ({
      id: it.id,
      dropOffId: d.id,
      batchId: shortCode(d.qrValue),
      name: it.name,
      category: it.categoryName,
      description: it.description || "",
      photo: it.photographUrl,
      status: STATUS_LABEL[it.status] || it.status,
      apiStatus: it.status,
      date: new Date(it.registeredAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }))
  );
}
