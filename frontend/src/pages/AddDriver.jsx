
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function AddDriver() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    alert("Form ready. Django saving API will be added next.");
  }

  return (
    <PageLayout title="Add Driver">
      <form className="storyboard-form" onSubmit={handleSubmit}>
        <div className="photo-upload">
          <div className="avatar avatar-large">
            {photo ? (
              <img src={URL.createObjectURL(photo)} alt="Driver preview" />
            ) : (
              "👤"
            )}
          </div>

          <label className="btn btn-gray">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setPhoto(e.target.files[0] || null)}
            />
          </label>
        </div>

        <input placeholder="Full name" required />
        <input placeholder="Address" required />
        <input placeholder="Contact number" required />
        <input placeholder="License number" required />

        <label>License expiry</label>
        <input type="date" required />

        <select defaultValue="" required>
          <option value="" disabled>Assigned jeepney</option>
          <option value="1">Unit 001</option>
          <option value="2">Unit 002</option>
          <option value="3">Unit 003</option>
        </select>

        <div className="form-actions">
          <button type="submit" className="btn btn-navy">
            SAVE
          </button>
          <button
            type="button"
            className="btn btn-gray"
            onClick={() => navigate("/drivers")}
          >
            CANCEL
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
