import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserRound } from "lucide-react";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { Field, JeepneySelect } from "../components/FleetOptions";
import { api } from "../api";
import { useAction, useResource } from "../hooks";

export default function AddDriver() {
  const { id } = useParams();
  const units = useResource("jeepneys/");
  const driver = useResource(id ? "drivers/" + id + "/" : null);
  const resources = id ? [units, driver] : [units];

  return (
    <PageLayout title={id ? "Edit Driver" : "Add Driver"}>
      <RecordsFeedback resources={resources} />
      {resources.every((resource) => resource.data) && (
        <DriverForm key={id} driver={driver.data} units={units.data} />
      )}
    </PageLayout>
  );
}

function DriverForm({ driver, units }) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState("");
  const action = useAction();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function save(event) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    if (!body.get("photo").size) body.delete("photo");
    action.run(async () => {
      await api(driver ? "drivers/" + driver.id + "/" : "drivers/", {
        method: driver ? "PATCH" : "POST", body,
      });
      navigate("/drivers");
    });
  }

  return (
    <form className="storyboard-form" onSubmit={save}>
      <div className="photo-upload">
        <div className="avatar avatar-large">
          {preview || driver?.photo_url ? (
            <img src={preview || driver.photo_url} alt="Driver profile" />
          ) : <UserRound size={28} aria-hidden="true" />}
        </div>
        <Field label="Profile photo">
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files[0];
              setPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
        </Field>
      </div>
      <Field label="Full name"><input name="name" defaultValue={driver?.name} maxLength={120} required /></Field>
      <Field label="Address"><input name="address" defaultValue={driver?.address} maxLength={250} required /></Field>
      <Field label="Contact number"><input name="contact" type="tel" defaultValue={driver?.contact} maxLength={40} required /></Field>
      <Field label="License number"><input name="license" defaultValue={driver?.license} maxLength={50} required /></Field>
      <Field label="License expiry"><input name="license_expiry" type="date" defaultValue={driver?.license_expiry} required /></Field>
      <JeepneySelect units={units} defaultValue={driver?.jeepney} currentUnit={driver && {
        id: driver.jeepney, unit_no: driver.unit_no,
      }} />
      <RecordsFeedback action={action} />
      <div className="form-actions">
        <button className="btn btn-navy" disabled={action.busy}>Save driver</button>
        <Link className="btn btn-gray" to="/drivers">Cancel</Link>
      </div>
    </form>
  );
}
