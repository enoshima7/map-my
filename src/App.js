import AMapLoader from "@amap/amap-jsapi-loader";
import { isEmpty, isEqual, throttle } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import readXlsxFile from "read-excel-file";
import ColorPicker from "./components/color-picker";
import { bankCode, bankPngUrl } from "./const";
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
  const [current, setCurent] = useState({});
  const [circleEditor, setCircleEditor] = useState([]);
  const [heatMapController, setHeatMapController] = useState({});
  const [mouseTool, setMouseTool] = useState({});
  const [currentPolygon, setCurrentPolygon] = useState({});
  // const [polygons, setPolygons] = useState([]);
  const [mapInstance, setMapInstance] = useState({});
  const polygons = useRef([]);
  const intersectionPaths = useRef([]);
  const intersectionPoligon = useRef({});

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
        // mapStyle: "amap://styles/twilight",
        viewMode: "3D",
        zoom: 15,
        center: ["106.537191", "29.588054"],
      });
      // setMapInstance(map);
      map.on("click", () => {
        console.log(polygons.current);
        polygons.current.forEach((v) =>
          v.setOptions({ strokeColor: "#1791fc" })
        );
      });
      map.on(
        "mousemove",
        throttle((e) => {
          const mouseplace = e.lnglat;
          if (polygons.current.length < 2) return;
          const inpoligongs = polygons.current.filter((v) =>
            v.contains([mouseplace.getLng(), mouseplace.getLat()])
          );
          // if (inpoligongs.length < 2) {
          map.remove(intersectionPoligon.current);
          intersectionPoligon.current = {};
          intersectionPaths.current = [];
          //   return;
          // }
          if (inpoligongs.length >= 2) {
            const newIntersectionPolygon = inpoligongs.reduce((a, b) => {
              return new AMap.Polygon({
                path: AMap.GeometryUtil.ringRingClip(a.getPath(), b.getPath()),
              });
            });
            const newIntersectionPaths = newIntersectionPolygon.getPath();
            if (isEqual(intersectionPaths.current, newIntersectionPaths)) {
              return;
            }
            intersectionPaths.current = newIntersectionPaths;
            intersectionPoligon.current = new AMap.Polygon({
              path: intersectionPaths.current,
              fillColor: "#fff", // 多边形填充颜色
              borderWeight: 1, // 线条宽度，默认为 1
              strokeColor: "#fff", // 线条颜色
              opacity: "0.5",
              bubble: true,
            });
            map.add(intersectionPoligon.current);
          }
        }, 100)
      );
      AMap.plugin(
        [
          "AMap.ToolBar",
          "AMap.Scale",
          "AMap.HawkEye",
          "AMap.MapType",
          "AMap.Geolocation",
          "AMap.MouseTool",
        ],
        function () {
          // 在图面添加工具条控件，工具条控件集成了缩放、平移、定位等功能按钮在内的组合控件
          map.addControl(new AMap.ToolBar());

          // 在图面添加比例尺控件，展示地图在当前层级和纬度下的比例尺
          map.addControl(new AMap.Scale());

          // 在图面添加鹰眼控件，在地图右下角显示地图的缩略图
          map.addControl(new AMap.HawkEye({ isOpen: true }));

          // 在图面添加类别切换控件，实现默认图层与卫星图、实施交通图层之间切换的控制
          map.addControl(new AMap.MapType());

          // 在图面添加定位控件，用来获取和展示用户主机所在的经纬度位置
          map.addControl(new AMap.Geolocation());

          const _mouseTool = new AMap.MouseTool(map);
          _mouseTool.on("draw", function (event) {
            event.obj.on("click", () => {
              setCurrentPolygon(event.obj);
              polygons.current
                .filter(
                  (p) => p.getExtData().key !== event.obj.getExtData().key
                )
                .forEach((f) => f.setOptions({ strokeColor: "#1791fc" }));
              event.obj.setOptions({ strokeColor: "#fefb53" });
            });
            event.obj.on("mousemove", () => {
              event.obj.setOptions({ bubble: true });
            });
            // event.obj 为绘制出来的覆盖物对象
            // event.obj.setOption
            // console.log(event.obj);

            console.log(event.obj);
            polygons.current = [...polygons.current, event.obj];
            _mouseTool.close(false);
          });
          setMouseTool(_mouseTool);
        }
      );
      const input = document.getElementById("input");
      input.addEventListener("change", () => {
        // map.clearMap();
        readXlsxFile(input.files[0]).then((rows) => {
          const [, ...res] = rows;
          const dataExcel = res.map((v) => {
            return {
              lng: v[1].toString(),
              lat: v[2].toString(),
              peopleCount: v[4],
              deposit: v[3],
              title: v[0],
            };
          });

          const circles = dataExcel.map((v) => {
            const circle = new AMap.Circle({
              center: new AMap.LngLat(v.lng, v.lat), // 圆心位置
              radius: (v.peopleCount * v.deposit) / 4000000, //半径
              // strokeColor: "#F33", //线颜色
              strokeOpacity: 0, //线透明度
              // strokeWeight: 3, //线粗细度
              fillColor: colors.reverse()[Math.round(v.deposit / 40000)], //填充颜色
              fillOpacity: 0.3, //填充透明度
              cursor: "pointer",
              zIndex: 2,
            });
            map.plugin(["AMap.CircleEditor"], function () {
              // 实例化多边形编辑器，传入地图实例和要进行编辑的多边形实例
              setCircleEditor((v) => [
                ...v,
                new AMap.CircleEditor(map, circle),
              ]);
            });
            circle.on(
              "mousemove",
              throttle((e) => {
                document.getElementById("hint").style.visibility = "visible";
                document.getElementById("hint").style.transform = `translateX(${
                  e.pixel.x + 25
                }px ) translateY(${e.pixel.y - 75}px)`;
                setCurent(v);
              }),
              1000
            );
            circle.on("mouseout", () => {
              document.getElementById("hint").style.visibility = "hidden";
            });
            return circle;
          });

          map.plugin(["AMap.HeatMap"], function () {
            //初始化heatmap对象
            const heatmap = new AMap.HeatMap(map, {
              radius: 130, //给定半径
              opacity: [0, 0.5],
              // maxOpacity: 0.3,
              // minOpacity: 0,
              blur: 0.75,
              // gradient: {
              //   0.5: "blue",
              //   0.65: "rgb(117,211,248)",
              //   0.7: "rgb(0, 255, 0)",
              //   0.9: "#ffea00",
              //   1.0: "red",
              // },
            });
            //设置数据集：该数据为北京部分“公园”数据
            heatmap.setDataSet({
              data: dataExcel.map((v) => ({
                lng: v.lng,
                lat: v.lat,
                count: (v.peopleCount * v.deposit) / 1000000,
              })),
              max: 1000,
            });
            heatmap.hide();
            setHeatMapController(heatmap);
          });
          map.add(circles);
          map.setFitView();
        });
      });

      const bankMarker = new AMap.Marker({
        position: new AMap.LngLat("106.537191", "29.588054"),
        // 将一张图片的地址设置为 icon
        icon: new AMap.Icon({
          size: new AMap.Size(60, 60), // 图标尺寸
          image: `${bankPngUrl}${bankCode[160104]}.png`, // Icon的图像
          // imageOffset: new AMap.Pixel(0, -60), // 图像相对展示区域的偏移量，适于雪碧图等
          imageSize: new AMap.Size(60, 60), // 根据所设置的大小拉伸或压缩图片
          zIndex: 1,
        }),
        // `${bankPngUrl}${bankCode[160104]}.png`,
        // 设置了 icon 以后，设置 icon 的偏移量，以 icon 的 [center bottom] 为原点
        // offset: new AMap.Pixel(-13, -30),
      });
      map.add(bankMarker);
      map.setFitView();
    });

    return () => {
      const input = document.getElementById("input");
      input.removeEventListener("change");
    };
  }, []);

  // useEffect(() => {
  //   if (!mapInstance) return;
  //   mapInstance.on("click", () => {
  //     polygons.forEach((v) => v.setOptions({ strokeColor: "#1791fc" }));
  //   });
  // }, [mapInstance]);

  const startEdit = () => {
    circleEditor.forEach((v) => v.open());
  };
  const endEdit = () => {
    circleEditor.forEach((v) => v.close());
  };
  const openHeatMap = () => {
    heatMapController.show();
  };
  const closeHeatMap = () => {
    console.log(heatMapController);
    heatMapController.hide();
  };
  const drawPolygon = () => {
    mouseTool.polygon({
      cursor: "pointer",
      strokeColor: "#1791fc",
      strokeOpacity: 0.4,
      fillColor: "#1791fc",
      fillOpacity: 0.4,
      // 线样式还支持 'dashed'
      strokeStyle: "solid",
      bubble: false,
      extData: {
        key: new Date().valueOf(),
      },
      // strokeStyle是dashed时有效
      // strokeDasharray: [30,10],
    });
  };
  const changeColor = (color) => {
    currentPolygon.setOptions({ fillColor: color });
  };
  return (
    <>
      <div id="container" className="container">
        <div id="hint">
          <div>{current.title}</div>
          <div>地区人数：{current.peopleCount}</div>
          <div>地区人均平均存款：{current.deposit}</div>
        </div>
        <input id="input" className="inputFile" type="file" />
        <button className="startBtn" onClick={startEdit}>
          开始编辑
        </button>
        <button className="endBtn" onClick={endEdit}>
          结束编辑
        </button>
        <button className="heatMapBtn" onClick={openHeatMap}>
          打开热力图
        </button>
        <button className="hideHeatMapBtn" onClick={closeHeatMap}>
          关闭热力图
        </button>
        <button className="drawPolygon" onClick={drawPolygon}>
          绘制多边形
        </button>
        <div className="colorPicker">
          <ColorPicker onChangeColor={changeColor} />
        </div>
      </div>
    </>
  );
}

export default App;
