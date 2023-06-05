/*
**********************************************************
1. 지도 생성 & 확대 축소 컨트롤러
https://apis.map.kakao.com/web/sample/addMapControl/
*/

var mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(37.29263835223535, 127.1170809701871), // 지도의 중심좌표
    level: 5, // 지도의 확대 레벨
  };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new kakao.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// kakao.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

/*
**********************************************************
2. 더미데이터 준비하기 (제목, 주소, url, 카테고리)
*/
async function getDataSet(category) {
  let qs = category;
  if (!qs) {
    qs = "";
  }

  const dataSet = await axios({
    method: "get", // http method
    url: `http://localhost:3000/restaurant?category=${qs}`,
    headers: {}, // packet header
    data: {}, // packet body
  });

  return dataSet.data.result;
}

/*
**********************************************************
3. 여러개 마커 찍기
  * 주소 - 좌표 변환
https://apis.map.kakao.com/web/sample/multipleMarkerImage/ (여러개 마커)
https://apis.map.kakao.com/web/sample/addr2coord/ (주소로 장소 표시하기)
*/

// 주소-좌표 변환 객체 생성
var geocoder = new kakao.maps.services.Geocoder();

/*
// 비동기로 지도에 마커를 추가하는 함수
async function setMap() {
  // dataSet 배열의 길이만큼 반복하여 각 주소에 대한 좌표를 얻고 마커를 추가합니다.
  for (var i = 0; i < dataSet.length; i++) {
    // 주소를 좌표로 변환하는 함수를 호출하고, 반환된 좌표를 coords 변수에 저장합니다.
    let coords = await getCroodsByAddress(dataSet[i].address);
    // 지도에 마커를 추가하는 객체를 생성하고, 지도 객체와 좌표를 설정합니다.
    var marker = new kakao.maps.Marker({
      map: map,
      position: coords,
    });
  }
}
*/

// 주소를 좌표로 변환하여 반환하는 함수
function getCroodsByAddress(address) {
  // Promise 객체를 반환하여 비동기 작업을 처리합니다.
  return new Promise((resolve, reject) => {
    // 주소 검색을 수행합니다. 검색 결과와 상태값을 콜백 함수의 인자로 전달합니다.
    geocoder.addressSearch(address, function (result, status) {
      // 검색이 정상적으로 완료되면 상태값이 'OK'가 됩니다.
      if (status === kakao.maps.services.Status.OK) {
        // 좌표 객체를 생성하고, 검색 결과의 x, y 값을 설정합니다.
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        // 좌표 객체를 resolve를 통해 반환합니다.
        resolve(coords);
        return;
      }
      // 상태값이 'OK'가 아닌 경우 에러를 반환합니다.
      reject(new Error("getCoordsByAddress Error: not vaild Address"));
    });
  });
}

/* 
******************************************************************************
4. 마커에 인포윈도우 붙이기
  * 마커에 클릭 이벤트로 인포윈도우 https://apis.map.kakao.com/web/sample/multipleMarkerEvent/
  * url에서 섬네일 따기
  * 클릭한 마커로 지도 센터 이동 https://apis.map.kakao.com/web/sample/moveMap/
*/

// 비동기로 지도에 마커를 추가하는 함수
async function setMap(dataSet) {
  for (var i = 0; i < dataSet.length; i++) {
    let coords = await getCroodsByAddress(dataSet[i].address);
    var marker = new kakao.maps.Marker({
      map: map,
      position: coords,
    });

    markerArray.push(marker);

    // 마커에 표시할 인포윈도우를 생성합니다
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
    });

    infowindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    kakao.maps.event.addListener(
      marker,
      "click",
      makeOverListener(map, marker, infowindow, coords)
    );
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
}

function getContent(data) {
  let videoId = "";
  let replaceUrl = data.videoUrl;
  replaceUrl = replaceUrl.replace("https://youtu.be/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/embed/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/watch?v=", "");
  finUrl = replaceUrl.split("&")[0];

  return `
  <div class="infowindow">
  <div class="infowindow-img-container">
      <a href="${data.videoUrl}" target="_blank">
        <img src="https://img.youtube.com/vi/${finUrl}/mqdefault.jpg"
        class="infowindow-img" alt="...">
      </a>
    </div>
  <div class="infowindow-body">
	  <h5 class="infowindow-title">${data.title}</h5>
	  <p class="infowindow-address">${data.address}</p>
	  <a href="${data.videoUrl}" class="infowindow-btn" target="_blank">살펴보기</a>
  </div>
</div> 
  `; // 인포윈도우 가공하기
}

// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
function makeOverListener(map, marker, infowindow, coords) {
  return function () {
    closeInfoWindow();
    infowindow.open(map, marker);
    map.panTo(coords);
  };
}

let infowindowArray = [];

function closeInfoWindow() {
  for (let infowindow of infowindowArray) {
    infowindow.close();
  }
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}

/* 
******************************************************************************
5. 카테고리 분류
*/

// 카테고리

const categoryMap = {
  all: "전체",
  korea: "한식",
  china: "중식",
  japan: "일식",
  america: "양식",
  wheat: "분식",
  meat: "구이",
  cafe: "카페",
  etc: "기타",
};

const categoryList = document.querySelector(".buttons");
categoryList.addEventListener("click", categoryHandler);

async function categoryHandler(event) {
  const categoryId = event.target.id;
  let category = categoryMap[categoryId];

  if (category === "전체") {
    category = "";
  }

  try {
    let categorizedDataset = await getDataSet(category); // 데이터 분류
    closeMarker(); // 기존 마커 삭제
    closeInfoWindow(); // 기존 윈포윈도우 닫기
    setMap(categorizedDataset);
  } catch (error) {
    console.error(error);
  }
}

let markerArray = [];
function closeMarker() {
  for (marker of markerArray) {
    marker.setMap(null);
  }
}

async function setting() {
  try {
    const dataSet = await getDataSet();
    setMap(dataSet);
  } catch (error) {
    console.error(error);
  }
}

setting();
