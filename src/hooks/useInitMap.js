import { useEffect, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { bankCode, bankPngUrl, initialPosition } from "../constant/const";
import { useGetState } from "ahooks";
import { throttle, isEqual } from "lodash-es";
import { Message } from "@arco-design/web-react";
export const useInitMap = () => {
  const [AMapInstance, setAMapInstance, getAMapInstance] = useGetState({});
  const [mapInstance, setMapInstance, getMapInstance] = useGetState({});
  const [polygons, setPolygons, getPolygons] = useGetState([]);
  const [currentPolygon, setCurrentPolygon, getCurrentPolygon] = useGetState(
    {}
  );
  const [intersectionPoligon, setIntersectionPoligon, getIntersectionPoligon] =
    useGetState({});
  const [intersectionPaths, setIntersectionPaths, getIntersectionPaths] =
    useGetState([]);
  const [mouseTool, setMouseTool, getMouseTool] = useGetState({});
  const [areaInfoVisible, setAreaInfoVisible] = useState(false);
  const [inpoligonList, setInpoligons] = useState([]);
  useEffect(() => {
    const InitMap = async () => {
      const AMap = await AMapLoader.load({
        key: "3c7e81341c917d97099a6b84341e206f", // 申请好的Web端开发者Key，首次调用 load 时必填
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      });
      setAMapInstance(AMap);
      const map = new AMap.Map("container", {
        mapStyle: "amap://styles/grey",
        viewMode: "3D",
        zoom: 15,
        center: initialPosition,
      });
      map.on("click", (e) => {
        if (!getPolygons().length) return;
        const mouseplace = e.lnglat;
        const inpoligongs = getPolygons().filter((v) =>
          v.contains([mouseplace.getLng(), mouseplace.getLat()])
        );
        if (!inpoligongs.length) {
          getPolygons().forEach((v) =>
            v.setOptions({ strokeOpacity: "0.5", strokeWeight: "2" })
          );
          setCurrentPolygon({});
        }
        if (inpoligongs.length) {
          const mostTopPolygon = inpoligongs.reduce((a, b) => {
            return a.getOptions().zIndex > b.getOptions().zIndex ? a : b;
          });
          getPolygons().map((v) => {
            if (v.getExtData().key === mostTopPolygon.getExtData().key) {
              v.setOptions({ strokeOpacity: "1", strokeWeight: "3" });
            } else {
              v.setOptions({ strokeOpacity: "0.5", strokeWeight: "2" });
            }
          });
          setCurrentPolygon(mostTopPolygon);
        }
        getPolygons().forEach((v) => v.setOptions({ strokeColor: "#1791fc" }));
      });
      map.on(
        "mousemove",
        throttle((e) => {
          const mouseplace = e.lnglat;
          if (getPolygons().length < 1) return;
          const inpoligons = getPolygons().filter((v) =>
            v.contains([mouseplace.getLng(), mouseplace.getLat()])
          );
          if (!inpoligons.length) {
            setAreaInfoVisible(false);
          }
          if (inpoligons.length) {
            setAreaInfoVisible(true);
            document.getElementById("areaInfo").style.transform = `translateX(${
              e.pixel.x + 100
            }px ) translateY(${e.pixel.y - 125}px)`;
            setInpoligons(inpoligons);
          }
          map.remove(getIntersectionPoligon());
          setIntersectionPoligon({});
          setIntersectionPaths([]);
          if (inpoligons.length >= 2) {
            const newIntersectionPolygon = inpoligons.reduce((a, b) => {
              return new AMap.Polygon({
                path: AMap.GeometryUtil.ringRingClip(a.getPath(), b.getPath()),
              });
            });
            const newIntersectionPaths = newIntersectionPolygon.getPath();
            if (isEqual(getIntersectionPaths(), newIntersectionPaths)) {
              return;
            }
            setIntersectionPaths(newIntersectionPaths);
            setIntersectionPoligon(
              new AMap.Polygon({
                path: getIntersectionPaths(),
                fillColor: "#fff", // 多边形填充颜色
                borderWeight: 1, // 线条宽度，默认为 1
                strokeColor: "#fff", // 线条颜色
                opacity: "0.5",
                bubble: true,
              })
            );
            map.add(getIntersectionPoligon());
          }
        }, 10)
      );
      AMap.plugin(
        [
          "AMap.ToolBar",
          "AMap.Scale",
          //   "AMap.HawkEye",
          "AMap.MapType",
          //   "AMap.Geolocation",
          "AMap.MouseTool",
        ],
        () => {
          // 在图面添加工具条控件，工具条控件集成了缩放、平移、定位等功能按钮在内的组合控件
          map.addControl(new AMap.ToolBar());

          // 在图面添加比例尺控件，展示地图在当前层级和纬度下的比例尺
          map.addControl(new AMap.Scale());

          // 在图面添加鹰眼控件，在地图右下角显示地图的缩略图
          //   map.addControl(new AMap.HawkEye({ isOpen: true }));

          // 在图面添加类别切换控件，实现默认图层与卫星图、实施交通图层之间切换的控制
          map.addControl(new AMap.MapType());

          // 在图面添加定位控件，用来获取和展示用户主机所在的经纬度位置
          //   map.addControl(new AMap.Geolocation());

          const _mouseTool = new AMap.MouseTool(map);
          _mouseTool.on("draw", (event) => {
            event.obj.setOptions({
              zIndex: getPolygons().length ? getPolygons().length + 10 : 10,
            });
            event.obj.on("mousemove", () => {
              event.obj.setOptions({ bubble: true });
            });
            setPolygons((v) => [...v, event.obj]);
            _mouseTool.close(false);
            Message.info("结束绘制");
          });
          setMouseTool(_mouseTool);
        }
      );

      setMapInstance(map);
    };
    InitMap();
  }, []);
  return {
    AMapInstance,
    mapInstance,
    polygons,
    setPolygons,
    currentPolygon,
    setCurrentPolygon,
    intersectionPoligon,
    intersectionPaths,
    mouseTool,
    areaInfoVisible,
    inpoligonList,
  };
};
