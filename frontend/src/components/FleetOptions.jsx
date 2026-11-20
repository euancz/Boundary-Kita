import { cloneElement, useId } from "react";

export function Field({ label, children }) {
  const id = useId();
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}

export function JeepneySelect({ units, name = "jeepney", defaultValue = "", currentUnit, required = false }) {
  return (
    <Field label="Jeepney">
      <select name={name} defaultValue={defaultValue || ""} required={required}>
        <option value="">{required ? "Select a jeepney" : "Unassigned"}</option>
        {currentUnit?.id && !units.some((unit) => unit.id === currentUnit.id) && (
          <option value={currentUnit.id}>Unit {currentUnit.unit_no} (archived)</option>
        )}
        {units.map((unit) => <option value={unit.id} key={unit.id}>Unit {unit.unit_no} · {unit.plate_no}</option>)}
      </select>
    </Field>
  );
}

export function DriverSelect({ drivers }) {
  return (
    <Field label="Driver">
      <select name="driver" defaultValue="" required>
        <option value="">Select a driver</option>
        {drivers.map((driver) => <option value={driver.id} key={driver.id}>{driver.name} · {driver.license}</option>)}
      </select>
    </Field>
  );
}
