export default function InputForm({ address, sheetName, onChange }) {
    const handleAddressChange = (e) => {
      onChange({ address: e.target.value, sheetName });
    };
  
    const handleSheetNameChange = (e) => {
      onChange({ address, sheetName: e.target.value });
    };
  
    return (
      <form className="p-4 space-y-2">
        <input
          type="text"
          placeholder="Enter Address"
          value={address}
          onChange={handleAddressChange}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Google Sheet Name"
          value={sheetName}
          onChange={handleSheetNameChange}
          className="border p-2 w-full"
        />
      </form>
    );
  }
  