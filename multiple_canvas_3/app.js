"use strict";

import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";

import {
  TrackballControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/TrackballControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector("#canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    // 렌더러가 투명도 버퍼(alpha buffer)를 포함할 지 결정함.
    // 기본적으로 WebGLRenderer는 지금까지 예제에서 사용해왔듯 검은색 배경이 default임.
    // 여기의 배경을 하얀색으로 보이게 하고 싶다면, 투명도 버퍼를 활성화해서 배경을 투명하게 처리함으로써 상위 요소인 body의 컬러가 드러나도록 하거나,
    // renderer에 넣어주는 scene 요소의 배경색을 white로 해야 됨. 그런데 지금은 가위 함수를 이용해서
    // 캔버스의 일부분만 scene으로 렌더링 해주려는 거니까 모든 부분이 scene의 배경색을 적용받을 수는 없음.
    // 그래서 위와 같이 alpha값을 활성화해서 상위 요소인 body의 white 배경색이 드러나게 한 것.
  });

  // 각 가상요소와 거기에 각 씬을 렌더링하는 함수를 객체로 묶어서 빈 배열에 담아주는 함수
  // 이렇게 하면 씬과 가상요소를 이후에 추가해주기 쉽고, 각 장면에서 움직임을 계산해서 렌더하는 함수를 작성할 때도 전체를 신경쓸 필요도 없음. -> 확장성!
  const sceneElements = [];

  function addScene(elem, fn) {
    sceneElements.push({
      elem,
      fn
    });
  }

  // 씬, 카메라, 조명, trckballControls를 생성한 뒤 객체로 묶어서 리턴해주는 함수
  function makeScene(elem) {
    // create scene
    const scene = new THREE.Scene();

    // create camera
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1, 2);
    camera.lookAt(0, 0, 0); // 카메라의 시선이 원점을 향하도록 지정함.

    // 조명을 씬에 바로 추가하는 게 아니라, 조명을 카메라에 추가하고, 카메라를 씬에 추가해줘서
    // 카메라가 움직일 때마다 조명도 따라 움직여서 카메라 지점에서 조명을 쏴주도록 하는거임
    // 이렇게 하면 빛이 계속 우리가 보는 방향에서 뻗어나가기 때문에 카메라를 어떻게 돌려보던지 씬을 밝게 비추어서 볼 수 있음.
    scene.add(camera);

    // trackballContols는 OrbitControls와 마찬가지로 카메라를 움직여주는 기능을 함.
    // 근데 차이점이 있다면 OrbitControls는 위쪽 끝 지점(북극)과 아랫쪽 끝 지점(남극)에서 카메라가 반대 방향으로 넘어가지 못하지만, trackballContols는 넘어갈 수 있음.
    // 이거를 공식 사이트에서는 좀 어렵게 설명을 해놨는데, 예제에서 OrbitControls 사용한거랑 북마크 해놓은 trackballControls 예제랑 비교해보면 금방 알 수 있음.
    const controls = new TrackballControls(camera, elem); // OrbitControls와 마찬가지로 카메라와 DOMElement를 전달해 줌
    controls.noZoom = true; // 줌 기능을 비활성화함.
    controls.noPan = true; // 패닝 기능을 비활성화함.

    // create directionalLight(직사광)
    {
      const color = 0xffffff;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      camera.add(light); // trackballCamera에 의해 카메라를 움직일 때마다 조명이 카메라를 계속 따라디니면서 카메라 위치에서 빛을 쏴주도록 하려는 거임. 
    }

    // 씬(조명이 자식노드로 추가된 상태), 카메라, trackballControls를 객체로 묶어서 리턴
    return {
      scene,
      camera,
      controls,
    };
  }

  // 각 key값을 data-diagram의 속성값으로 지정하고,
  // value를 씬과 메쉬를 각각 만들어서 해당 씬에 해당 메쉬를 렌더링하는 장면 렌더링 함수를 리턴해주는 익명함수로 각각 할당함.
  const sceneInitFuntionsByName = {
    'box': (elem) => {
      const {
        scene,
        camera,
        controls
      } = makeScene(elem); // 씬, 카메라, trackballControls가 묶인 객체를 리턴받아서 각각 const scene, camera, controls에 할당함.

      // 육면체 메쉬를 생성함
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({
        color: "red",
      });
      const mesh = new THREE.Mesh(geometry, material);

      scene.add(mesh); // 이 block에서 할당받은 scene에 자식노드로 육면체 메쉬를 추가함.

      // 장면 렌더링 함수를 리턴함
      return (t, rect) => {
        mesh.rotation.y = t * 0.1; // 매 프레임마다 받아오는 타임스탬프값을 이용해서 메쉬를 y축 방향으로 회전시킴
        camera.aspect = rect.width / rect.height; // 가상요소의 bounding box값을 이용해서 이 block 안에서 할당받은 카메라 비율(aspect)를 업데이트함.
        camera.updateProjectionMatrix();
        controls.handleResize(); // TrackballControls를 사용하고 있는 어플리케이션이 리사이징되면 반드시 호출해줘야 함.
        controls.update(); // TrackballControls를 사용하고 있는데 리사이징이 일어났다면 애니메이션 루프에서 꼭 업데이트 메서드를 호출해줘야 함. (장면 렌더링 함수는 animate 함수에서 매번 호출되니까!)
        renderer.render(scene, camera); // 이 block 안에서 할당받은 씬, 카메라를 전달해서 렌더해주도록 함.
      };
    },
    'pyramid': (elem) => {
      const {
        scene,
        camera,
        controls
      } = makeScene(elem); // 씬, 카메라가 묶인 객체를 리턴받아서 각각 const scene, camera에 할당함.

      // 구체 지오메트리를 이용해서 다이아몬드 메쉬를 생성함
      const radius = 0.8;
      const widthSegments = 4;
      const heightSegments = 2;
      const geometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments
      );
      const material = new THREE.MeshPhongMaterial({
        color: "blue",
        flatShading: true, // 물체를 각지게(faceted) 표현할 지의 여부를 결정함. 구체가 다이아몬드처럼 보이려면 각지게 표현되어야 겠지
      });
      const mesh = new THREE.Mesh(geometry, material);

      scene.add(mesh); // 이 block에서 할당받은 scene에 자식노드로 다이아몬드 메쉬를 추가함.

      // 장면 렌더링 함수를 리턴함
      return (t, rect) => {
        mesh.rotation.y = t * 0.1; // 매 프레임마다 받아오는 타임스탬프값을 이용해서 메쉬를 y축 방향으로 회전시킴
        camera.aspect = rect.width / rect.height; // 가상요소의 bounding box값을 이용해서 이 block 안에서 할당받은 카메라 비율(aspect)를 업데이트함.
        camera.updateProjectionMatrix();
        controls.handleResize();
        controls.update();
        renderer.render(scene, camera); // 이 block 안에서 할당받은 씬, 카메라를 전달해서 렌더해주도록 함.
      };
    }
  }

  /**
   * [data-diagram] 이라는 attribute를 갖고 있는 element들을 모두 참조해 옴.
   * (참고로 querySelectorAll(CSS selector) 및 querySelector(CSS selector)는 해당 css selector를 갖는 요소(들)을 참조해 오도록 함.)
   * 
   * 그럼 2개의 span 태그가 담긴 NodeList 배열이 리턴될거고, 걔내 두 요소 각각에 대해 forEach로 반복문을 돌림
   * 1. 그래서 각 요소의 data-diagram의 값을 sceneName에 할당해놓고, 
   * 2. 해당 sceneName과 일치하는 sceneInitFunctionsByName의 key값에 할당된 익명함수를 sceneInitFunction에 할당해주고, 
   * 3. sceneInitFunction에 할당된 익명함수를 각 요소(elem)를 전달하면서 호출해서 장면 렌더링 함수를 sceneRenderFunction에 리턴해서 할당해주고,
   * 4. 마지막으로 각 요소(elem)과 sceneRenderFunction함수를 전달하면서 addScene 함수를 호출해줘서 sceneElements에 객체로 묶어 담아놓도록 해줌.
   * 이렇게 하면 animate 함수에서 sceneElements를 사용할 준비를 마치는 것임 
   */
  document.querySelectorAll('[data-diagram]').forEach((elem) => {
    const sceneName = elem.dataset.diagram; // data-diagram의 값을 할당함
    const sceneInitFuntion = sceneInitFuntionsByName[sceneName]; // sceneName과 일치하는 key값에 할당된 익명함수를 넣어줌
    const sceneRenderFuntion = sceneInitFuntion(elem); // 익명함수를 span 요소와 함께 전달하면서 호출함.
    addScene(elem, sceneRenderFuntion); // span 요소, 리턴받은 장면 렌더링 함수를 함께 전달하면서 addScene 함수를 호출함.
  });

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate 함수에서 렌더러 전체를 clear 해줄때마다 어떤 색으로 클리어 될것인지 결정함. -> black으로 clear되겠군.
  const clearColor = new THREE.Color("#000");

  function animate(t) {
    t *= 0.001; // 밀리초 단위의 타임스탬프 값을 초 단위로 변환함.

    // 렌더러를 리사이징해줌.
    // 카메라 비율을 따로 업데이트하지 않는 이유는, 가상요소 영역만큼만 가위영역을 지정해서 그 부분만 렌더해줄 거기 때문에, 카메라 비율도 가상요소 영역의 비율로 업데이트해주기 때문임.
    // 그래서 굳이 canvas 전체의 비율로 카메라 비율을 업데이트 해주지 않아도 됨.
    resizeRendererToDisplaySize(renderer);

    // 내 생각에는 매 프레임마다 가위영역을 다시 계산해서 지정하기 위해(왜? 리사이징이나 스크롤이 발생할 수 있으니까) setScissorTest(true)를 호출해줘야 하잖아.
    // 이걸 매 프레임마다 해주려고 하다보니 먼저 setScissorTest(false)로 비활성화하여 초기화한 뒤 다시 true로 활성화를 시키는거지.
    // 뭔가 이거를 setScissorTest(false)를 호출하지 않는다고 해서 원래 가위영역이 남아있는 것도 아닌걸 보면 위에 이유 말고는 다른 이유가 없는 것 같음...
    renderer.setScissorTest(false);
    renderer.setClearColor(clearColor, 0); // black, 투명도 0인 색으로 클리어 해준다는 것은, 클리어 됬을 때 렌더러가 완전 투명한 색이 된다는 거임.
    renderer.clear(true, true); // 현재 렌더러의 색상 버퍼와 깊이 버퍼를 지워줌으로써 렌더러 전체를 비워준 뒤 렌더링을 시작할 수 있도록 함.
    renderer.setScissorTest(true); // 이 메서드에 true를 전달하면, 캔버스 전체에서 가위영역으로 지정한 부분의 픽셀들만 렌더링하도록 함.

    /**
     * canvas 요소의 position을 absolute로 변경하고 난 뒤,
     * 브라우저가 현재 프레임에서 스크롤된 지점으로 translateY값을 구한 뒤
     * 캔버스 요소의 스타일값에 매번 할당해 줌.
     *
     * 이렇게 하면 fixed를 사용한 것과 마찬가지로 매 프레임마다 브라우저상의 같은 위치에 고정되어 보이지만
     * 사실은 transform값을 매 프레임마다 계산해서 캔버스 요소를 끌어내려 주는 것임.
     *
     * 이렇게 해주면 fixed와 다른 점이 fixed는 다른 요소가 스크롤에 의해 움직일때도 가만히 있으니까
     * 씬이 뭔가 관성을 가지고 한 박자 늦게 따라가는 것처럼 보이는데,
     * absolute로 지정해주면 다른 요소와 같이 스크롤을 따라 움직이지만
     * 매 프레임마다 transform값을 계산하여 위치값을 이동시켜주기 때문에 한 박자 늦게 따라가는 현상이 사라짐.
     */
    const transform = `translateY(${window.scrollY}px)`;
    renderer.domElement.style.transform = transform;

    // sceneElements 배열을 for...of로 순회하면서 이전에 renderSceneInfo 함수에서 해주던 작업들을
    // animate 함수 내부에서 각각의 씬과 가상요소에 대하여 해준다고 보면 됨.
    for (const {
        elem,
        fn
      } of sceneElements) {
      // 할당받은 가상요소인 const elem으로부터 DOMRect를 리턴받아 const rect에 할당함.
      const rect = elem.getBoundingClientRect();
      // 가상요소의 CSS offset, size값이 담긴 DOMRect의 각각의 값들을 const에 할당함.
      const {
        left,
        right,
        top,
        bottom,
        width,
        height
      } = rect;

      // 가상요소의 CSS offset 값을 모두 확인해서 스크롤 등에 의해 현재 브라우저 화면 바깥으로 벗어나 있는 상태인지 체크해 줌.
      const isOffscreen =
        bottom < 0 ||
        top > renderer.domElement.clientHeight ||
        right < 0 ||
        left > renderer.domElement.clientWidth;

      if (isOffscreen) {
        return; // 브라우저 바깥으로 벗어났다면 함수를 여기서 끝냄. 더 이상 캔버스에 해당 scene을 렌더해주지 않을거임.
      }

      // WebGLRenderer.setScissor() 메서드로 가상요소만큼의 가위 영역을 설정하고,
      // setViewport로 뷰포트 영역을 지정해서 씬의 좌표를 설정함. (뷰포트는 캔버스 상에서 씬을 어디에 위치하게 할 것인지를 정하는 것 같음.)
      const positiveYUpBottom = renderer.domElement.clientHeight - bottom; // 2d 캔버스는 y좌표가 아래쪽이 양의 축이지만, WebGLRenderer는 y좌표가 위쪽이 양의 축이라서 이 값을 기준으로 가위영역과 뷰포트영역의 기준점을 지정하려는 것 같음.
      renderer.setScissor(left, positiveYUpBottom, width, height); // setScissor(x, y, width, height) 총 4개의 인자를 받거나, Vector4로 4개의 값을 전달받는데, 이때, 기준점인 (x, y)는 가위 영역의 왼쪽 아래 꼭지점을 기준으로 함.
      renderer.setViewport(left, positiveYUpBottom, width, height); // setScissor와 마찬가지 방식으로 인자를 전달받음.

      // 각 객체 묶음에 존재하는 장면 렌더링 함수를 호출해 줌.
      // 이 안에서 이제 메쉬의 움직임을 계산해주고, 카메라 비율 업데이트 해주고, 씬을 렌더해주고 할거임.
      fn(t, rect);
    }

    requestAnimationFrame(animate); // 내부적으로 반복호출함.
  }

  requestAnimationFrame(animate);
}

main();