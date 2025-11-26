// Three.jsのインポート
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

//既存テクスチャ読み込み用
const baseTextureImage = new Image();
baseTextureImage.crossOrigin = "anonymous";

//木目テクスチャロード
const WOOD_TEXTURE_PATH = '/texture/wood.png';
const textureLoader = new THREE.TextureLoader();
let woodTexture;

//マテリアル定義
let planeMaterial;

//初期化フラグ
let isInitialized =false;

// フォントごとの文字間隔調整値
const FONT_SPACING_ADJUSTMENTS = {
    'ta-fuga-fude': 0, 
    'kokuryu': -0.1,
    'ab-ootori': 0, 
    'ab-togetsukanteiryu': 0,
    'ta-engeifude': 0
};

//ここから処理-------------------
//ページの描画が終わるまで待ち、初期化関数を実行する
window.addEventListener('DOMContentLoaded', () => {

    //木目テクスチャのロード
    textureLoader.load(WOOD_TEXTURE_PATH, (texture) =>{
        woodTexture = texture;
        initializeThreeJS();
    }, undefined, (error) =>{
        console.error('テクスチャのロードに失敗しました', error);
        initializeThreeJS();
    });
});

//初期化関数
function initializeThreeJS(){
    if (isInitialized) return;
    isInitialized =true;

    //コンテナ設定
    const container= document.getElementById('x3d-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    //シーン、カメラ、レンダラのセットアップ
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 45, width/ height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize( width, height);

    //HTML表示用
    container.appendChild( renderer.domElement);

    //ウインドウサイズ変更時のリサイズ
    window.addEventListener('resize',() => {
        const newWidth = container.clientWidth;
        const newHeight= container.clientHeight;

        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
    });

    //平面plane
    const planeWidth = 2.5;
    const planeHeight = 6;
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    planeMaterial = new THREE.MeshStandardMaterial({
        color:0xcccccc,
        metalness:0.1,
        roughness:0.5
    });
    const plane =new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    //カメラ位置
    camera.position.set(0,0,8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    //アニメーション
    function animate(){
        requestAnimationFrame(animate);
        controls.update();

        renderer.render(scene,camera);
    }
    animate();

    //ライティング
    const ambientLight = new THREE.AmbientLight(0xffdd99,1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff,100);
    pointLight.position.set(5,5,5);
    scene.add(pointLight);

    //既存テクスチャのロード、切り替え
    function loadBaseTexture(filename) {
        // テクスチャのロード完了まで待ち、初期文字でテクスチャを更新
        baseTextureImage.onload = () => {
            const textInput = document.getElementById('text-input');
            updatePlaneTexture(textInput.value || '試作品');
        };
        baseTextureImage.onerror = () => {
            console.error(`背景テクスチャのロードに失敗しました: /texture/${filename}`);
        };
        // 既存テクスチャをロード（パスは適宜調整してください）
        baseTextureImage.src = `/texture/${filename}`;
    }
    // テクスチャ選択のイベントリスナー
    const textureInputs = document.querySelectorAll('input[name="bg-texture"]');
    textureInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            loadBaseTexture(event.target.value);
        });
    });



    //文字からテクスチャ作成
    function updatePlaneTexture(text){
        //初期値 テクスチャサイズ、HTMLのフォント、フォントサイズ
        const CANVAS_SIZE = 512;
        const fontSizeInput = document.getElementById('font-size-input');
        const fontFamilyInput = document.getElementById('font-family-input');
        const FONT_FAMILY = fontFamilyInput.value || 'sans-serif';
        let FONT_SIZE = parseInt(fontSizeInput.value, 10);
        if (isNaN(FONT_SIZE) || FONT_SIZE < 10) {
        FONT_SIZE = 120;
        }   
        console.log(FONT_SIZE);

        //-----バンプマップ作成 背景と文字-----
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = CANVAS_SIZE;
        bumpCanvas.height = CANVAS_SIZE;
        const b_ctx = bumpCanvas.getContext('2d');

        //背景色
        b_ctx.fillStyle = 'black';
        b_ctx.fillRect(0,0, CANVAS_SIZE, CANVAS_SIZE);

        //枠用テクスチャのdraw
        if (baseTextureImage && baseTextureImage.complete) {
                b_ctx.drawImage(baseTextureImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            }

        //文字の描画
        b_ctx.fillStyle = 'white';
        b_ctx.font = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
        b_ctx.textAlign = 'center';
        b_ctx.textBaseline = 'middle';
        const characters = text.split('');
        const centerX = CANVAS_SIZE/2;
        //行間調整によるテキストエリアの高さを計算 文字数*フォント別字間
        const percentspacingAdjustment = FONT_SPACING_ADJUSTMENTS[FONT_FAMILY] || 0;
        const spacingAdjustment = percentspacingAdjustment * FONT_SIZE;
        const numCharacters = characters.length;
        let totalAdjustedHeight = 0;
        if (numCharacters > 0) {
            totalAdjustedHeight = numCharacters * FONT_SIZE + (numCharacters - 1) * spacingAdjustment;
        }
        //文字横書き
        //const centerY = CANVAS_SIZE/2;
        //const lines = text.split('\n');
        //const lineheight =80;
        //const startY = centerY - ((lines.length -1) * lineheight /2 );
        //    lines.forEach((line, index) =>{
        //    const y = startY + index * lineheight;
        //    ctx.fillText(line, centerX,y);
        //});
        //縦書き文字 bumpCanvasにdraw
        //const totalTextHeight = characters.length * FONT_SIZE;
        const blockTopY = (CANVAS_SIZE / 2) - (totalAdjustedHeight / 2)+16;
        let currentY = blockTopY + (FONT_SIZE / 2);
        characters.forEach((char, index) =>{
            b_ctx.fillText(char, centerX, currentY);
            currentY += FONT_SIZE + spacingAdjustment;
        });

        //-----アルベドテクスチャの作成 木目読み込み-----
        const albedoCanvas = document.createElement('canvas');
        albedoCanvas.width = CANVAS_SIZE;
        albedoCanvas.height = CANVAS_SIZE;
        const a_ctx = albedoCanvas.getContext('2d');
        // a) ベースレイヤー: 木目テクスチャの描画
        if (woodTexture && woodTexture.image.complete) {
            a_ctx.drawImage(woodTexture.image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        } else {
            // 木目テクスチャがない場合の代替色
            a_ctx.fillStyle = '#8B4513'; 
            a_ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
        //バンプマップCanvasを乗算で重ねる
        const multiply_strength = 0.8;
        a_ctx.globalCompositeOperation = 'multiply';
        a_ctx.globalAlpha = multiply_strength;
        a_ctx.drawImage(bumpCanvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        a_ctx.globalAlpha = 1.0;       
        a_ctx.globalCompositeOperation = 'source-over'; // リセット

        //-----テクスチャをマテリアルに適用-----
        //初期化
        if(planeMaterial.bumpMap){
            planeMaterial.bumpMap.dispose();
            planeMaterial.map.dispose();
        }

        //テクスチャ作成
        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        planeMaterial.bumpMap = bumpTexture;
        planeMaterial.bumpScale = 8;

        const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
        planeMaterial.map = albedoTexture;



        //縦横比調整
        const planeWidth = 2.5;
        const planeHeight = 6;
        const aspect = planeHeight / planeWidth;
        const offsetX = (1- (1/aspect))/2;
        //テクスチャに適用
        bumpTexture.repeat.set(1/ aspect,1);
        bumpTexture.offset.set(offsetX,0);
        albedoTexture.repeat.set(1/ aspect,1);
        albedoTexture.offset.set(offsetX,0);
        //マテリアル更新

        planeMaterial.needsUpdate = true;
        bumpTexture.needsUpdate = true;
        albedoTexture.needsUpdate = true;

        // デバッグ用: <body>内に一時的に表示
        //document.body.appendChild(bumpCanvas);
        //bumpCanvas.style.position = 'absolute';
        //bumpCanvas.style.left = '0px'; 
        //bumpCanvas.style.top = '250px';
        //bumpCanvas.style.zIndex = '9999';
    }

//テキスト、文字サイズ、選択テクスチャをHTMLから読み込み～更新
    const textInput = document.getElementById('text-input');
    const fontSizeInput = document.getElementById('font-size-input');
    const fontFamilyInput = document.getElementById('font-family-input');
    const initialTextureFile = document.querySelector('input[name="bg-texture"]:checked').value;
    loadBaseTexture(initialTextureFile);
    //updatePlaneTexture(initialText);
    
    function handleInputChange() {
        // すべての必要なリソース（背景テクスチャ、木目テクスチャ）がロードされているか確認
        if (baseTextureImage.complete && woodTexture && woodTexture.image.complete) {
            // 💡 引数なしで updatePlaneTextures を呼び出す
            updatePlaneTexture(textInput.value);
        }
    }
    
    // 1. テキスト、フォントサイズ入力のイベント handleinputchangeを呼び出して更新
    textInput.addEventListener('input', handleInputChange);
    fontSizeInput.addEventListener('input', handleInputChange);
    fontFamilyInput.addEventListener('change', handleInputChange);
    
    //textInput.addEventListener('input', () =>{
    //    if (baseTextureImage.complete) {
    //        updatePlaneTexture(textInput.value);
    //        }
    //});
}
