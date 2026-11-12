import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL; // e.g. https://luggage-api.onrender.com/api

export default function HostelRoomSelect({ value, onChange }) {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const hostelId = value?.hostelId || "";
  const roomId = value?.roomId || "";

  useEffect(() => {
    fetch(`${API}/auth/hostels`)
      .then((r) => r.json())
      .then((j) => setHostels(j.data || []))
      .catch(() => setError("Could not load hostels"));
  }, []);

  useEffect(() => {
    if (!hostelId) { setRooms([]); return; }
    fetch(`${API}/auth/hostels/${hostelId}/rooms`)
      .then((r) => r.json())
      .then((j) => setRooms(j.data || []))
      .catch(() => setError("Could not load rooms"));
  }, [hostelId]);

  return (
    <>
      <label>
        Hostel
        <select value={hostelId} onChange={(e) => onChange({ hostelId: e.target.value, roomId: "" })} required>
          <option value="">Select hostel</option>
          {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </label>
      <label>
        Room
        <select value={roomId} onChange={(e) => onChange({ hostelId, roomId: e.target.value })} disabled={!hostelId} required>
          <option value="">Select room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.type === "KITCHEN" ? `Kitchen ${r.roomNo}` : `Room ${r.roomNo}`}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </>
  );
}