import { useEffect, useRef, useState } from "react";
import { isEmpty, map, throttle } from "lodash-es";
import readXlsxFile from "read-excel-file";
import ColorPicker from "./components/color-picker";
import {
  Button,
  Statistic,
  Upload,
  Switch,
  Input,
  Message,
  Select,
} from "@arco-design/web-react";
import { IconInfoCircle } from "@arco-design/web-react/icon";
import { useInitMap } from "./hooks/useInitMap";
import { useGetState } from "ahooks";
import { bankCode, bankPngUrl, colors } from "./constant/const";
import "./App.css";
const Option = Select.Option;
function App() {
  const [circleEditor, setCircleEditor] = useState([]);
  const [heatMapController, setHeatMapController] = useState({});
  const [circlesList, setCirclesList] = useState([]);
  const [bankMarkers, setBankMarkers] = useState([]);
  const [polygonData, setPolygonData] = useState({});
  const [currentCircleData, setCurrentCircleData, getCurrentCircleData] =
    useGetState({
      title: "",
      peopleCount: 0,
      deposit: 0,
    });
  const peopleCountRef = useRef();
  const depositRef = useRef();
  const [hintVisible, setHintVisible] = useState(false);
  const [bankHintVisible, setBankHintVisible] = useState(false);
  const [currentBankData, setCurrentBankData] = useState({});
  const {
    AMapInstance,
    polygons,
    currentPolygon,
    mouseTool,
    mapInstance,
    areaInfoVisible,
    inpoligonList,
    setCurrentPolygon,
    setPolygons,
  } = useInitMap();
  useEffect(() => {
    if (hintVisible) {
      peopleCountRef.current?.countUp();
      depositRef.current?.countUp();
    }
  }, [hintVisible]);
  useEffect(() => {
    if (!isEmpty(currentPolygon)) {
      setPolygonData(currentPolygon.getExtData()?.data);
    }
  }, [currentPolygon]);
  const startEdit = () => {
    circleEditor.forEach((v) => v.open());
  };
  const endEdit = () => {
    circleEditor.forEach((v) => v.close());
  };
  const drawPolygon = (e) => {
    Message.info("开始绘制多边形");
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
    });
  };
  const changeColor = (color) => {
    currentPolygon.setOptions({ fillColor: color });
  };
  const uploadBankExcel = async (e) => {
    mapInstance.remove(bankMarkers);
    const file = e[0].originFile;
    const rows = await readXlsxFile(file);
    const [, ...res] = rows;
    const bankData = res.map((v) => {
      return {
        lng: v[1].toString(),
        lat: v[2].toString(),
        title: v[0],
      };
    });
    const bankMarkersFromExcel = bankData.map((v) => {
      const marker = new AMapInstance.Marker({
        position: new AMapInstance.LngLat(v.lng, v.lat),
        // 将一张图片的地址设置为 icon
        icon: new AMapInstance.Icon({
          // size: new AMapInstance.Size(19, 32), // 图标尺寸
          image: `https://webapi.amap.com/theme/v1.3/markers/b/mark_bs.png`, // Icon的图像
          // imageOffset: new AMapInstance.Pixel(0, -60), // 图像相对展示区域的偏移量，适于雪碧图等
          imageSize: new AMapInstance.Size(19, 32), // 根据所设置的大小拉伸或压缩图片
          zIndex: 300,
        }),
      });
      marker.on(
        "mousemove",
        throttle((e) => {
          setCurrentBankData(v);
          setBankHintVisible(true);
          document.getElementById("bankHint").style.transform = `translateX(${
            e.pixel.x + 25
          }px ) translateY(${e.pixel.y - 75}px)`;
        }),
        100
      );
      marker.on("mouseout", () => {
        setCurrentBankData({});
        setBankHintVisible(false);
      });
      return marker;
      // `${bankPngUrl}${bankCode[160104]}.png`,
      // 设置了 icon 以后，设置 icon 的偏移量，以 icon 的 [center bottom] 为原点
      // offset: new AMap.Pixel(-13, -30),
    });
    setBankMarkers(bankMarkersFromExcel);
    mapInstance.add(bankMarkersFromExcel);
    mapInstance.setFitView();
  };
  const uploadExcel = (e) => {
    mapInstance.remove(circlesList);
    const file = e[0].originFile;
    readXlsxFile(file).then((rows) => {
      const [, ...res] = rows;
      let dataExcel = res.map((v) => {
        return {
          lng: v[1].toString(),
          lat: v[2].toString(),
          peopleCount: v[4],
          deposit: v[3],
          title: v[0],
        };
      });
      const circles = dataExcel
        .sort((a, b) => b.peopleCount * b.deposit - a.peopleCount * a.deposit)
        .map((v, index) => {
          console.log(Math.round((v.deposit * v.peopleCount) / 400000000));
          const circle = new AMapInstance.Circle({
            center: new AMapInstance.LngLat(v.lng, v.lat), // 圆心位置
            radius: Math.max((v.peopleCount * v.deposit) / 4000000, 90), //半径
            // strokeColor: "#F33", //线颜色
            strokeOpacity: 0, //线透明度
            // strokeWeight: 3, //线粗细度
            fillColor:
              colors.reverse()[
                Math.round((v.deposit * v.peopleCount) / 400000000)
              ], //填充颜色
            fillOpacity: 0.3, //填充透明度
            cursor: "pointer",
            zIndex: index + 2,
          });
          mapInstance.plugin(["AMap.CircleEditor"], function () {
            // 实例化多边形编辑器，传入地图实例和要进行编辑的多边形实例
            setCircleEditor((v) => [
              ...v,
              new AMapInstance.CircleEditor(mapInstance, circle),
            ]);
          });
          circle.on(
            "mousemove",
            throttle((e) => {
              setCurrentCircleData(v);
              setHintVisible(true);
              document.getElementById("hint").style.transform = `translateX(${
                e.pixel.x + 25
              }px ) translateY(${e.pixel.y - 75}px)`;
            }),
            100
          );
          circle.on("mouseout", () => {
            setHintVisible(false);
            // setCurrentCircleData({});
            document.getElementById("hint").style.visibility = "hidden";
          });
          return circle;
        });
      mapInstance.plugin(["AMap.HeatMap"], function () {
        //初始化heatmap对象
        const heatmap = isEmpty(heatMapController)
          ? new AMapInstance.HeatMap(mapInstance, {
              radius: 200, //给定半径
              opacity: [0.1, 0.5],
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
            })
          : heatMapController;

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
      mapInstance.add(circles);
      setCirclesList(circles);
      mapInstance.setFitView();
    });
  };
  const toggleHeatMap = (e) => {
    e ? heatMapController.show() : heatMapController.hide();
  };
  const addPolygonData = () => {
    currentPolygon.setExtData({
      ...currentPolygon.getExtData(),
      data: polygonData,
    });
    Message.success("添加数据成功！");
  };
  const deletePolygon = () => {
    mapInstance.remove(currentPolygon);
    setPolygons((v) =>
      v.filter((p) => p.getExtData().key !== currentPolygon.getExtData().key)
    );
    setCurrentPolygon({});
    Message.success("删除多边形成功！");
  };
  const toggleCircles = (e) => {
    circlesList.forEach((v) => (!e ? v.hide() : v.show()));
  };
  const options = [
    { name: "标准", id: "amap://styles/normal" },
    { name: "马卡龙", id: "amap://styles/macaron" },
    { name: "涂鸦", id: "amap://styles/graffiti" },
    { name: "远山黛", id: "amap://styles/whitesmoke" },
    { name: "幻影黑", id: "amap://styles/dark" },
    { name: "草色青", id: "amap://styles/fresh" },
    { name: "极夜蓝", id: "amap://styles/darkblue" },
    { name: "靛青蓝", id: "amap://styles/blue" },
    { name: "月光银", id: "amap://styles/light" },
    { name: "雅士灰", id: "amap://styles/grey" },
  ];
  return (
    <>
      <div id="container" className="container">
        <div
          id="bankHint"
          style={{ visibility: bankHintVisible ? "visible" : "hidden" }}
        >
          <Statistic
            title="银行"
            value={currentBankData.title}
            styleValue={{ color: "#4293f8" }}
          />
        </div>
        <div
          id="hint"
          style={{ visibility: hintVisible ? "visible" : "hidden" }}
        >
          <Statistic
            title="地区"
            value={currentCircleData.title}
            styleValue={{ color: "#4293f8" }}
          />
          <Statistic
            ref={(ref) => (peopleCountRef.current = ref)}
            title="人数"
            value={currentCircleData.peopleCount}
            groupSeparator
            suffix=" 人"
            countUp
            countFrom={100}
            countDuration={1000}
            styleValue={{ color: "#be5683" }}
          />
          <Statistic
            ref={(ref) => (depositRef.current = ref)}
            title="人均平均存款"
            value={currentCircleData.deposit}
            groupSeparator
            // prefix={<IconArrowRise />}
            suffix=" ¥"
            countUp
            countDuration={1000}
            countFrom={1000}
            styleValue={{ color: "#e29d0e" }}
          />
        </div>
        <div
          id="areaInfo"
          style={{ visibility: areaInfoVisible ? "visible" : "hidden" }}
        >
          {inpoligonList.length === 1 ? (
            <>
              <Statistic
                title="地区"
                value={inpoligonList[0].getExtData().data?.name || "请设置"}
                styleValue={{ color: "#4293f8" }}
              />
              <Statistic
                // ref={(ref) => (peopleCountRef.current = ref)}
                title="人数"
                value={inpoligonList[0].getExtData().data?.peopleCount || 0}
                countUp
                countDuration={1000}
                groupSeparator
                suffix=" 人"
                styleValue={{ color: "#be5683" }}
              />
              <Statistic
                // ref={(ref) => (depositRef.current = ref)}
                title="人均存款"
                value={inpoligonList[0].getExtData().data?.deposit || 0}
                groupSeparator
                countUp
                countDuration={1000}
                // prefix={<IconArrowRise />}
                suffix=" ¥"
                styleValue={{ color: "#e29d0e" }}
              />
              <Statistic
                // ref={(ref) => (depositRef.current = ref)}
                title="备注"
                value={inpoligonList[0].getExtData().data?.note || "请设置"}
                groupSeparator
                // prefix={<IconArrowRise />}
                styleValue={{ color: "#e29d0e" }}
              />
            </>
          ) : (
            <>
              <Statistic
                title="地区"
                value={inpoligonList
                  .map((v) => v.getExtData().data?.name)
                  .join("、")}
                styleValue={{ color: "#4293f8" }}
              />
              <Statistic
                // ref={(ref) => (peopleCountRef.current = ref)}
                title={`${inpoligonList.length}地区平均人数`}
                value={Math.round(
                  inpoligonList.reduce((a, b) => {
                    return a + Number(b.getExtData().data?.peopleCount) || 0;
                  }, 0) / inpoligonList.length
                )}
                countUp
                countDuration={1000}
                groupSeparator
                suffix=" 人"
                styleValue={{ color: "#be5683" }}
              />
              <Statistic
                // ref={(ref) => (depositRef.current = ref)}
                title={`${inpoligonList.length}地区人均存款`}
                value={Math.round(
                  inpoligonList.reduce((a, b) => {
                    return a + Number(b.getExtData().data?.deposit) || 0;
                  }, 0) / inpoligonList.length
                )}
                groupSeparator
                countUp
                countDuration={1000}
                // prefix={<IconArrowRise />}
                suffix=" ¥"
                styleValue={{ color: "#e29d0e" }}
              />
              {/* <Statistic
                // ref={(ref) => (depositRef.current = ref)}
                title="备注"
                value={inpoligonList[0].getExtData().data?.note || "请设置"}
                groupSeparator
                // prefix={<IconArrowRise />}
                styleValue={{ color: "#e29d0e" }}
              /> */}
            </>
          )}
        </div>
        <div className="toolsWrapper">
          <div className="toolItem">
            <div className="label">地图样式</div>
            <div className="tool">
              <Select
                style={{ width: 154 }}
                placeholder="选择地图样式"
                onChange={(value) => mapInstance.setMapStyle(value)}
              >
                {options.map((option, index) => (
                  <Option key={option.id} value={option.id}>
                    {option.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
          <div className="toolItem">
            <div className="label">上传区域Excel</div>
            <div className="tool">
              <Upload
                className="uploadExcel"
                accept=".xlsx"
                onChange={uploadExcel}
                action={null}
                multiple={false}
                autoUpload={false}
                showUploadList={false}
              />
            </div>
          </div>
          <div className="toolItem">
            <div className="label">上传银行坐标Excel</div>
            <div className="tool">
              <Upload
                className="uploadExcel"
                accept=".xlsx"
                onChange={uploadBankExcel}
                action={null}
                multiple={false}
                autoUpload={false}
                showUploadList={false}
              />
            </div>
          </div>
          {circlesList.length ? (
            <>
              {/* <div className="toolItem">
                <div className="label">编辑圆圈</div>
                <div className="tool">
                  <Button
                    type="primary"
                    className="startBtn"
                    onClick={startEdit}
                  >
                    编辑圆圈
                  </Button>
                  <Button
                    type="primary"
                    status="danger"
                    className="endBtn"
                    onClick={endEdit}
                  >
                    结束编辑
                  </Button>
                </div>
              </div> */}

              <div className="toolItem">
                <div className="label">区域圆圈范围开关</div>
                <div className="tool">
                  <Switch
                    type="round"
                    onChange={toggleCircles}
                    defaultChecked={true}
                  />
                </div>
              </div>
              <div className="toolItem">
                <div className="label">热力图开关</div>
                <div className="tool">
                  <Switch type="round" onChange={toggleHeatMap} />
                </div>
              </div>
            </>
          ) : null}

          <div className="toolItem">
            <div className="label">绘制多边形</div>
            <div className="tool">
              {/* <Switch type="round" onChange={drawPolygon} /> */}
              <Button
                type="primary"
                className="drawPolygon"
                onClick={drawPolygon}
              >
                绘制多边形
              </Button>
            </div>
          </div>
          {!isEmpty(currentPolygon) ? (
            <>
              <div className="toolItem">
                <div className="label">设置颜色</div>
                <div className="tool">
                  <ColorPicker onChangeColor={changeColor} />
                </div>
              </div>
              <div className="toolItem">
                <div className="label">设置数据</div>
                <div className="tool">
                  <div>
                    <div className="toolLabel">地区名称</div>
                    <Input
                      allowClear
                      value={polygonData?.name}
                      style={{ width: 200 }}
                      suffix={<IconInfoCircle />}
                      placeholder="请输入地区名称"
                      onChange={(name) =>
                        setPolygonData((v) => ({ ...v, name }))
                      }
                    />
                  </div>
                  <div>
                    <div className="toolLabel">地区人数</div>
                    <Input
                      allowClear
                      value={polygonData?.peopleCount}
                      style={{ width: 200 }}
                      suffix={<IconInfoCircle />}
                      placeholder="请输入地区人数"
                      onChange={(peopleCount) =>
                        setPolygonData((v) => ({ ...v, peopleCount }))
                      }
                    />
                  </div>
                  <div>
                    <div className="toolLabel">人均存款</div>
                    <Input
                      value={polygonData?.deposit}
                      allowClear
                      style={{ width: 200 }}
                      suffix={<IconInfoCircle />}
                      placeholder="请输入地区人均存款"
                      onChange={(deposit) =>
                        setPolygonData((v) => ({ ...v, deposit }))
                      }
                    />
                  </div>
                  <div>
                    <div className="toolLabel">备注</div>
                    <Input
                      allowClear
                      value={polygonData?.note}
                      style={{ width: 200 }}
                      suffix={<IconInfoCircle />}
                      placeholder="请输入备注"
                      onChange={(note) =>
                        setPolygonData((v) => ({ ...v, note }))
                      }
                    />
                  </div>
                  <Button
                    style={{ marginTop: 8 }}
                    type="primary"
                    onClick={addPolygonData}
                  >
                    确定
                  </Button>
                  <Button
                    type="primary"
                    status="danger"
                    onClick={deletePolygon}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default App;
