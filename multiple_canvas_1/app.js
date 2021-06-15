'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true
    // 렌더러가 투명도 버퍼(alpha buffer)를 포함할 지 결정함.
    // 기본적으로 WebGLRenderer는 지금까지 예제에서 사용해왔듯 검은색 배경이 default임.
    // 여기의 배경을 하얀색으로 보이게 하고 싶다면, 투명도 버퍼를 활성화해서 배경을 투명하게 처리함으로써 상위 요소인 body의 컬러가 드러나도록 하거나,
    // renderer에 넣어주는 scene 요소의 배경색을 white로 해야 됨. 그런데 지금은 가위 함수를 이용해서
    // 캔버스의 일부분만 scene으로 렌더링 해주려는 거니까 모든 부분이 scene의 배경색을 적용받을 수는 없음.
    // 그래서 위와 같이 alpha값을 활성화해서 상위 요소인 body의 white 배경색이 드러나게 한 것.
  })

  // 씬, 카메라, 조명을 생성한 뒤, 전달받은 가상요소와 함께 객체로 묶어서 리턴해주는 함수
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
    camera.lookAt(0, 0, 0) // 카메라의 시선이 원점을 향하도록 지정함.

    // create directionalLight(직사광)
    {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
    }

    // 씬(조명이 자식노드로 추가된 상태), 카메라, 가상요소를 객체로 묶어서 리턴 
    return {
      scene,
      camera,
      elem
    };
  }

  // 각각 makeScene을 호출해서 씬, 카메라, 가상요소가 묶인 객체를 리턴받은 뒤, 각각 육면체, 다이아몬드 메쉬를 생성하여 해당 객체에 추가해줘서 다시 리턴하는 함수
  function setupScene1() {
    const sceneInfo = makeScene(document.querySelector('#box')); // makeScene을 호출하여 리턴받은 객체 묶음이 할당됨

    // 육면체 메쉬를 생성함
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 'red'
    });
    const mesh = new THREE.Mesh(geometry, material);

    sceneInfo.scene.add(mesh); // 객체 묶음에 있는 scene에 자식노드로 육면체 메쉬를 추가함.
    sceneInfo.mesh = mesh; // 객체 묶음에 mesh라는 key를 만든 뒤, 거기에 육면체 메쉬를 value로 할당함.

    return sceneInfo; // 수정한 객체 묶음을 다시 리턴해 줌.
  }

  function setupScene2() {
    const sceneInfo = makeScene(document.querySelector('#pyramid')); // makeScene을 호출하여 리턴받은 객체 묶음이 할당됨

    // 구체 지오메트리를 이용해서 다이아몬드 메쉬를 생성함
    const radius = 0.8;
    const widthSegments = 4;
    const heightSegments = 2;
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({
      color: 'blue',
      flatShading: true // 물체를 각지게(faceted) 표현할 지의 여부를 결정함. 구체가 다이아몬드처럼 보이려면 각지게 표현되어야 겠지
    })
    const mesh = new THREE.Mesh(geometry, material);

    sceneInfo.scene.add(mesh); // 객체 묶음에 있는 scene에 자식노드로 다이아몬드 메쉬를 추가함.
    sceneInfo.mesh = mesh; // 객체 묶음에 mesh라는 key를 만든 뒤, 거기에 다이아몬드 메쉬를 value로 할당함.

    return sceneInfo; // 수정한 객체 묶음을 다시 리턴해 줌.
  }

  // 각각 호출한 함수들로부터 수정된 객체 묶음이 리턴되어 할당될거임
  const sceneInfo1 = setupScene1();
  const sceneInfo2 = setupScene2();

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

  // 얘는 animate 함수에서 매 프레임마다 호출될 때마다 각 sceneInfo1, 2에 담긴 가상요소의 CSS offset, size를 가져온 뒤 그걸로 씬에 렌더할 가위 영역을 지정해서 렌더해 줌.
  function renderSceneInfo(sceneInfo) {
    // sceneInfo 객체묶음 안에 존재하는 요소들을 각각 const scene, camera, elem에 할당함.
    const {
      scene,
      camera,
      elem
    } = sceneInfo;

    // 가상요소의 CSS offset, size값이 담긴 DOMRect의 각각의 값들을 const에 할당함.
    const {
      left,
      right,
      top,
      bottom,
      width,
      height
    } = elem.getBoundingClientRect();

    // 가상요소의 CSS offset 값을 모두 확인해서 스크롤 등에 의해 현재 브라우저 화면 바깥으로 벗어나 있는 상태인지 체크해 줌.
    const isOffscreen =
      bottom < 0 ||
      top > renderer.domElement.clientHeight ||
      right < 0 ||
      left > renderer.domElement.clientWidth;

    if (isOffscreen) {
      return; // 브라우저 바깥으로 벗어났다면 함수를 여기서 끝냄. 더 이상 캔버스에 해당 scene을 렌더해주지 않을거임.
    }

    // 가상요소의 DOMRect 영역만큼 렌더할거니까 렌더할 장면을 찍는 카메라의 비율도 가상요소의 비율에 맞게 업데이트해줌.
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // WebGLRenderer.setScissor() 메서드로 가상요소만큼의 가위 영역을 설정하고, 
    // setViewport로 뷰포트 영역을 지정해서 씬의 좌표를 설정함. (뷰포트는 캔버스 상에서 씬을 어디에 위치하게 할 것인지를 정하는 것 같음.)
    const positiveYUpBottom = renderer.domElement.clientHeight - bottom; // 2d 캔버스는 y좌표가 아래쪽이 양의 축이지만, WebGLRenderer는 y좌표가 위쪽이 양의 축이라서 이 값을 기준으로 가위영역과 뷰포트영역의 기준점을 지정하려는 것 같음.
    renderer.setScissor(left, positiveYUpBottom, width, height); // setScissor(x, y, width, height) 총 4개의 인자를 받거나, Vector4로 4개의 값을 전달받는데, 이때, 기준점인 (x, y)는 가위 영역의 왼쪽 아래 꼭지점을 기준으로 함.
    renderer.setViewport(left, positiveYUpBottom, width, height); // setScissor와 마찬가지 방식으로 인자를 전달받음.

    renderer.render(scene, camera)
  }

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
    renderer.clear(true, true); // 현재 렌더러의 색상 버퍼와 깊이 버퍼를 지워줌으로써 렌더러 전체를 비워준 뒤 렌더링을 시작할 수 있도록 함.
    renderer.setScissorTest(true); // 이 메서드에 true를 전달하면, 캔버스 전체에서 가위영역으로 지정한 부분의 픽셀들만 렌더링하도록 함.

    // 각 sceneInfo1, 2 안에 들어있는 메쉬들의 y축 회전값을 매 프레임마다 바꿔서 회전시켜 줌
    sceneInfo1.mesh.rotation.y = t * 0.1;
    sceneInfo2.mesh.rotation.y = t * 0.1;

    // renderSceneInfo 함수를 각각 호출하여 각 씬 별로 가위영역을 지정하고 렌더해 줌
    renderSceneInfo(sceneInfo1);
    renderSceneInfo(sceneInfo2);

    requestAnimationFrame(animate); // 내부적으로 반복호출함.
  }

  requestAnimationFrame(animate);
}

main();