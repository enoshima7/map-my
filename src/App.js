import AMapLoader from "@amap/amap-jsapi-loader";
import { isEmpty, throttle } from "lodash-es";
import { useEffect, useState } from "react";
import readXlsxFile from "read-excel-file";
import { data } from "./const";
import "./App.css";
const colors = [
  // '#BB3D00',
  // '#D94600',
  // '#F75000',
  "#4D0000	",
  "#930000",
  "#FF0000",
  "#FF5151",
  "#FFB5B5",
  "#FFECEC",
];
function App() {
  useEffect(() => {
    AMapLoader.load({
      key: "3c7e81341c917d97099a6b84341e206f", // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      // plugins: [],
      // Loca: {
      //   // 是否加载 Loca， 缺省不加载
      //   version: "2.0.0", // Loca 版本，缺省 1.3.2
      // },
    }).then((AMap) => {
      const map = new AMap.Map("container", {
        mapStyle: "amap://styles/grey",
        viewMode: "2D",
        zoom: 15,
        center: [106.537191, 29.588054],
      });
      const circles = data.map((v) => {
        const circle = new AMap.Circle({
          center: new AMap.LngLat(v.lng, v.lat), // 圆心位置
          radius: (v.peopleCount * 4) / 100, //半径
          // strokeColor: "#F33", //线颜色
          strokeOpacity: 0, //线透明度
          // strokeWeight: 3, //线粗细度
          fillColor: colors.reverse()[Math.round(v.deposit / 40000)], //填充颜色
          fillOpacity: 0.3, //填充透明度
          cursor: "pointer",
        });
        // circle.on("mouseover", (ev) => {
        //   document.getElementById("container").style.cursor = "pointer";
        //   console.log(v.title);
        // });
        // circle.on(
        //   "mousemove",
        //   throttle((e) => {
        //     document.getElementById("hint").style.transform = `translateX(${
        //       e.pixel.x + 25
        //     }px ) translateY(${e.pixel.y - 75}px)`;
        //   }),
        //   1000
        // );
        // circle.on("mouseout", () => {
        //   document.getElementById("container").style.cursor = "default";
        // });
        return circle;
      });
      map.add(circles);
      // const input = document.getElementById("input");
      // input.addEventListener("change", () => {
      //   map.clearMap();
      //   readXlsxFile(input.files[0]).then((rows) => {
      //     const [noneed, ...res] = rows;
      //     const data = res.map((v) => {
      //       return {
      //         lng: v[1],
      //         lat: v[2],
      //         peopleCount: v[4],
      //         deposit: v[3],
      //         title: v[0],
      //       };
      //     });
      //   });
      // });
    });
    return () => {
      // const input = document.getElementById("input");
      // input.removeEventListener("change");
    };
  }, []);
  return (
    <>
      <div id="container" className="container">
        <div id="hint">1111</div>
        {/* <input id="input" className="inputFile" type="file" id="input" /> */}
      </div>
    </>
  );
}

export default App;
