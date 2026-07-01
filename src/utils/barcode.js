let barcodeData = null;

export const setBarcode = (data) => {
  barcodeData = data;
};

export const getBarcode = () => {
  const data = barcodeData;
  barcodeData = null; // Clear after reading
  return data;
};
