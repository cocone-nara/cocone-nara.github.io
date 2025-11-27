// Three.jsのインポート
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
//import { TextureLoader } from 'three/src/loaders/TextureLoader.js';

//----------文字サイズスライダー用----------
const fontSizeInput = document.getElementById('font-size-input');
const fontSizeValue = document.getElementById('font-size-value');


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

// スライダーの値が変更されたときの処理
fontSizeInput.addEventListener('input', (event) => {
    fontSizeValue.textContent = event.target.value;
});
window.addEventListener('load', () => {
    fontSizeValue.textContent = fontSizeInput.value;
});

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
    renderer.setClearColor(0xD0D0D0);

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
    planeGeometry.computeTangents();
    planeMaterial = new THREE.MeshStandardMaterial({
        color:0xcccccc,
        metalness:0.1,
        roughness:0.3
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
    const ambientLight = new THREE.AmbientLight(0xffcc77,1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffddaa,50);
    pointLight.position.set(2,4,5);
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

        const scaleFactor = CANVAS_SIZE / 512;
        if (isNaN(FONT_SIZE) || FONT_SIZE < 10) {
        FONT_SIZE = 120;
        }   
        FONT_SIZE = FONT_SIZE * scaleFactor;
        console.log(FONT_SIZE);

        //字間調整 テキストエリアの高さを計算 文字数*フォント別字間
        const characters = text.split('');
        const percentspacingAdjustment = FONT_SPACING_ADJUSTMENTS[FONT_FAMILY] || 0;
        const spacingAdjustment = percentspacingAdjustment * FONT_SIZE;
        const numCharacters = characters.length;
        let totalAdjustedHeight = 0;
        if (numCharacters > 0) {
            totalAdjustedHeight = numCharacters * FONT_SIZE + (numCharacters - 1) * spacingAdjustment;
        }
        const centerX = CANVAS_SIZE/2;
        const blockTopY = (CANVAS_SIZE / 2) - (totalAdjustedHeight / 2)+23;

        //文字描画関数
        function drawText(ctx, color){
            ctx.fillStyle = 'white';
            ctx.font = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let currentY = blockTopY + (FONT_SIZE / 2);
            characters.forEach((char, index) =>{
                ctx.fillText(char, centerX, currentY);
                currentY += FONT_SIZE + spacingAdjustment;
            });
        }   
        //------------初期設定ここまで------------

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
        drawText(b_ctx, 'white');

        //-----アルベドテクスチャの作成 木目読み込み-----
        const albedoCanvas = document.createElement('canvas');
        albedoCanvas.width = CANVAS_SIZE;
        albedoCanvas.height = CANVAS_SIZE;
        const a_ctx = albedoCanvas.getContext('2d');
        // a) ベースレイヤー: 木目テクスチャの描画,テクスチャがないときの代替色
        if (woodTexture && woodTexture.image.complete) {
            a_ctx.drawImage(woodTexture.image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        } else {
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
        if(planeMaterial.bumpMap) planeMaterial.bumpMap.dispose();
        if(planeMaterial.map) planeMaterial.map.dispose();
        if(planeMaterial.roughnessMap) planeMaterial.roughnessMap.dispose();

        //テクスチャ作成 マテリアル設定
        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
        planeMaterial.bumpMap = bumpTexture;
        planeMaterial.bumpScale = 8;
        planeMaterial.map = albedoTexture;
        planeMaterial.roughnessMap = bumpTexture;
        planeMaterial.roughness = 1.0;

    planeMaterial.onBeforeCompile = (shader) => {
        if (shader.fragmentShader.includes('#define ROUGHNESS_INVERTED')) {
            return; // 挿入済みなら何もしない
        }
        shader.fragmentShader = `#define ROUGHNESS_INVERTED\n` + shader.fragmentShader;
        const roughnessSampleLine = '#include <roughnessmap_fragment>';
        shader.fragmentShader = shader.fragmentShader.replace(
            roughnessSampleLine,
            `
            float roughnessFactor = roughness;
            #ifdef USE_ROUGHNESSMAP
                vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
                float invertedRoughness = ( 1.0 - texelRoughness.g ); 
                float blendedRoughness = mix (0.5, invertedRoughness, 0.6);
                roughnessFactor *= blendedRoughness;
            #endif
            `
        );
    };

        //縦横比調整
        const planeWidth = 2.5;
        const planeHeight = 6;
        const aspect = planeHeight / planeWidth;
        const offsetX = (1- (1/aspect))/2;
        //各テクスチャに適用
        [bumpTexture, albedoTexture].forEach(tex => {
            tex.repeat.set(1/ aspect, 1);
            tex.offset.set(offsetX, 0.0);
            tex.colorSpace = THREE.SRGBColorSpace;
            if(tex === bumpTexture) {
                tex.colorSpace = THREE.NoColorSpace;
            }
            tex.needsUpdate = true; 
        });

        planeMaterial.needsUpdate = true;

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
    
    async function handleUpdateButtonClick() {
        const textValue = textInput.value;
        const currentFont = fontFamilyInput.value;

        if (typeof Typekit !== 'undefined' && Typekit.load){
                Typekit.load({kitId: 'jzc7gce'});
            }
        if (currentFont !== 'sans-serif' && textValue.length > 0) {
            console.log(`フォント「${currentFont}」のロードを待機中...`);
            await waitForFont(currentFont, textValue);
        console.log('フォントのロード完了。テクスチャを更新します。');
        }
        // すべての必要なリソース（背景テクスチャ、木目テクスチャ）がロードされているか確認
        if (baseTextureImage.complete && woodTexture && woodTexture.image.complete) {
            updatePlaneTexture(textValue);
        }
    }
    
    //更新ボタンクリック時処理
    const updateButton = document.getElementById('update-button');
    if (updateButton) {
        updateButton.addEventListener('click', handleUpdateButtonClick);
    }
    // 1. テキスト、フォントサイズ入力のイベント handleinputchangeを呼び出して更新
    //textInput.addEventListener('input', handleUpdateButtonClick);
    //fontSizeInput.addEventListener('input', handleUpdateButtonClick);
    //fontFamilyInput.addEventListener('change', handleUpdateButtonClick);
}

/**
 * 指定されたフォントが、特定のテキストに対して利用可能になるまで待機する
 * @param {string} fontName - フォントファミリー名 (例: 'ta-fuga-fude')
 * @param {string} text - 検出対象のテキスト
 * @returns {Promise<void>}
 */
const waitForFont = (fontName, text) => {
    // 1. ダミー要素を作成し、ブラウザに新しいグリフのダウンロードを促す
    const $dummyText = document.createElement("div");
    $dummyText.textContent = text;
    // フォント名を引用符で囲んで設定（Canvas描画と同じ設定）
    $dummyText.style.fontFamily = `"${fontName}", sans-serif`;
    $dummyText.style.position = "absolute"; 
    $dummyText.style.top = "-9999px"; 
    $dummyText.style.visibility = "hidden";
    document.body.appendChild($dummyText);
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 最大10秒待つ (100ms * 100回)

        const checkFontStatus = () => {
            attempts++;
            
            // 2. document.fonts.check() でフォントが読み込まれたかを確認
            // 'middle'ベースラインに合わせたサイズでチェック
            const isFontReady = document.fonts.check(`120px "${fontName}"`, text);

            if (isFontReady || attempts >= maxAttempts) {
                // ロード完了、またはタイムアウト
                $dummyText.remove();
                resolve();
                return;
            }
            
            // 3. 100ミリ秒後に再チェック
            setTimeout(checkFontStatus, 100);
        };
        
        checkFontStatus();
    });
};