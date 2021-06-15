"use strict";

import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";

import {
  TrackballControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/TrackballControls.js';

function main() {
  // create WebGLRenderer
  const canvas = document.createElement("canvas"); // 캔버스를 참조하지 않고 직접 새로 만듦.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
  });
  // 근데 지금 보면 알겠지만, WebGLRenderer를 만드는 데 사용한 캔버스는 DOM에 appendChild 하지는 않은 상태잖아?
  // 이거는 이전 예제처럼 원래 DOM에 존재하던 캔버스 요소를 참조해서 가져온 것과는 또 다른 경우임.
  // 그렇기 때문에 가위영역을 지정해서 계속 렌더를 해주더라도 화면에 보이지는 않을거임. 왜? 애초에 렌더러를 만드는 데 사용한 캔버스를 DOM에 추가하지는 않았으니까!
  renderer.setScissorTest(true); // 가위테스트를 초반에 활성화 함.

  // 각 가상요소와 거기에 각 씬을 렌더링하는 함수를 객체로 묶어서 빈 배열에 담아주는 함수
  // 이렇게 하면 씬과 가상요소를 이후에 추가해주기 쉽고, 각 장면에서 움직임을 계산해서 렌더하는 함수를 작성할 때도 전체를 신경쓸 필요도 없음. -> 확장성!
  const sceneElements = [];

  function addScene(elem, fn) {
    const ctx = document.createElement('canvas').getContext('2d'); // 2D 캔버스를 각각의 가상요소마다 하나씩 추가로 만들어 줌.
    elem.appendChild(ctx.canvas); // 가상요소에 새로 만든 2D 캔버스들을 자식노드로 추가해 줌. 모든 캔버스는 css에 의해 부모노드의 100% 꽉차게 될테니 이 캔버스의 사이즈는 가상요소의 사이즈와 동일하겠지?
    sceneElements.push({
      elem,
      ctx,
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

  function animate(t) {
    t *= 0.001; // 밀리초 단위의 타임스탬프 값을 초 단위로 변환함.

    // sceneElements 배열을 for...of로 순회하면서 이전에 renderSceneInfo 함수에서 해주던 작업들을
    // animate 함수 내부에서 각각의 씬과 가상요소에 대하여 해준다고 보면 됨.
    for (const {
        elem,
        fn,
        ctx
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
      const rendererCanvas = renderer.domElement; // 렌더러의 전체 캔버스(이하 '렌더링용 캔버스')를 가져옴.

      // 가상요소의 CSS offset 값을 모두 확인해서 스크롤 등에 의해 현재 브라우저 화면 바깥으로 벗어나 있는 상태인지 체크해 줌.
      const isOffscreen =
        bottom < 0 ||
        top > window.innerHeight ||
        right < 0 ||
        left > window.innerWidth; // 참고로 canvas 요소를 그냥 부모 태그의 width, height의 100%로 꽉차게 했으므로, 렌더링용 캔버스의 width, height은 결국 브라우저 창의 사이즈와 동일함.

      // 가상요소가 브라우저 창 안쪽에 존재할 경우에만 if block을 수행함
      if (!isOffscreen) {
        // 먼저 렌더링용 캔버스가 브라우저 리사이징 등의 이유로 가상요소의 사이즈보다 작아진다면, 최소한 가상요소의 사이즈 만큼 키워주도록 함.
        if (rendererCanvas.width < width || rendererCanvas.height < height) {
          renderer.setSize(width, height, false);
        }

        // 또 만약에 가상요소에 appendChild된 2d 캔버스의 크기가 가상요소와 다르다면 같도록 조정해 줌. (기본적으로는 css에서 모든 캔버스는 부모노드의 사이즈에 100%로 맞추도록 되어있기는 함)
        // 참고로 조건문 속에 보면 알겠지만 기본적으로 2d context 객체는 canvas 요소를 포함하고 있음.
        if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
          ctx.canvas.width = width;
          ctx.canvas.height = height;
        }

        /**
         * 렌더러에서 가위영역과 뷰포트영역을 지정하는데, 
         * 이 예제에서는 렌더러의 가위영역에서 렌더한 장면들을 매 프레임마다 복사해준 뒤,
         * 가상요소의 자식노드인 2d 캔버스로 복사해주기 때문에
         * 원본 렌더러의 가위영역의 위치가 반드시 가상요소와 동일할 필요가 없음.
         * 
         * 왜냐면 렌더러의 가위영역에 렌더되는 장면을 보여줄 것이 아니라,
         * 그거를 복사해서 가상요소의 자식노드인 2d 캔버스에서 보여줄 거니까!
         * 
         * 그래서 이렇게 위치를 0, 0으로 아무렇게나 할당해버린거임.
         * 
         * 근데 setScissor 및 setViewport 메서드에서 (0, 0) 지점은 해당 영역의 왼쪽 아래 꼭지점을 기준으로 한다는 게 중요함.
         * 그러면 (0, 0)을 기준으로 width는 오른쪽으로, height은 위로 더해져서 영역이 지정될건데
         * 이렇게 하면 가위영역은 아마도 렌더러 바깥쪽이 아니라, 렌더러 왼쪽 아래 꼭지점부터 시작해서 width, height을 더해주는 거 같음.
         * 실제로 렌더러용 캔버스를 appendChild해서 확인해보면 렌더러용 캔버스의 왼쪽 아래 꼭지점부터 가위영역이 그려져서 렌더되는 것을 확인할 수 있음.
         * 
         * 튜토리얼 예제에서 ctx.drawImage 할 때, 렌더러의 복사하고자 하는 원본 씬의 위치를 0, rendererCanvas.height - height 이렇게 잡는 것을 보면
         * setScissor 메서드가 기준점을 (0, 0)으로 잡았을 때 알아서 렌더러의 왼쪽 아래 꼭지점부터 가위영역을 지정하도록 잡아주는 것 같음. 뷰포트 영역도 마찬가지...
         */
        renderer.setScissor(0, 0, width, height);
        renderer.setViewport(0, 0, width, height);

        // 각 객체 묶음에 존재하는 장면 렌더링 함수를 호출해 줌.
        // 이 안에서 이제 메쉬의 움직임을 계산해주고, 카메라 비율 업데이트 해주고, 씬을 렌더해주고 할거임.
        fn(t, rect);

        // globalCompositeOperation = 'copy'로 지정하면, 2d 캔버스에 새롭게 그려지는 shape만 보이고, 이전에 그려진 shape은 안보이게 처리함.
        // 그래서 drawImage를 이용해서 렌더링용 캔버스에 그려지는 씬을 복사해서 가상요소의 자식노드인 2d 캔버스에 매 프레임마다 새롭게 그려주잖아.
        // 이때 이전 프레임에서 그려졌던 장면은 안보이게 하고, 현재 프레임에서 새롭게 그려지는 장면만 보이도록 하는거지.
        // globalCompositeOperation = 'copy'를 이용해서 ctx.clearRect()효과를 준 것과 같다고 보면 됨.
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(
          rendererCanvas, // 참고로 drawImage 메서드의 image 자리에는 이미지 객체를 일반적으로 넣지만, 캔버스 요소를 넣어주는 것도 가능함.
          0, rendererCanvas.height - height, width, height, // 전체 렌더러용 캔버스에서 가위영역 만큼을 crop해옴.
          0, 0, width, height // 가상요소 자식인 2d 캔버스는 가상요소와 사이즈를 동일하게 지정해줬기 때문에 가상요소의 width, height은 2d 캔버스의 width, height과 동일함. 
          // 따라서 2d 캔버스의 전체 영역 만큼에 crop한 렌더 장면을 그려주게 될거임. 
        );

        // 여기서 헷갈리면 안되는 부분이, 렌더러용 캔버스는 애초에 맨 처음에 생성하고 나서 DOM에 추가해주지 않았기 때문에
        // 가위영역을 지정해서 장면을 렌더해주더라도 렌더러용 캔버스에 렌더해주는 장면은 화면에 보이지는 않을거임.
      }
    }

    requestAnimationFrame(animate); // 내부적으로 반복호출함.
  }

  requestAnimationFrame(animate);
}

main();

// 이렇게 4번 예제처럼 렌더러용 캔버스에 가위영역을 지정해서 장면을 렌더하고, 그거를 각각의 가상요소의 자식노드인 2D 캔버스에 복사해주는 방식은
// 렌더러에서 가위영역을 어떻게 분리해야 될 지를 신경쓰지 않아도 된다는 장점이 있지만, 각 영역을 복사해서 2D 캔버스에 따로 그려줘야 되기 때문에 성능이 느릴수 밖에 없음.
// 당연히 성능이 느려지지. 왜냐? 렌더러에만 그려주면 될거를 2D 캔버스에도 복사해서 중복해서 그려주잖아.
// 렌더러에 그려주는 씬은 화면에 보이지는 않겠지만 그 장면을 그려내기 위한 계산은 매 프레임마다 진행될거고, 그거를 2D 캔버스에도 복사해서 drawImage 해줘야 하니까 
// 가상요소가 몇개가 되던 2배로 똑같은 장면을 중복해서 그려줘야 하는 셈.