import { HexColorPicker } from "react-colorful";
import { useState } from "react";
const ColorPicker = ({ onChangeColor }) => {
  const [color, setColor] = useState("#aabbcc");
  return <HexColorPicker color={color} onChange={onChangeColor} />;
};
export default ColorPicker;
