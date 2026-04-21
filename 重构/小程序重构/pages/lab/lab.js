const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
      v_uv = a_position * 0.5 + 0.5;
      v_uv.y = 1.0 - v_uv.y; 
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform float u_scrollY;
  uniform vec2 u_resolution;
  
  // 圆角矩形距离场计算 (SDF)
  float sdRoundRect(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b + vec2(r);
      return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }
  
  // 过程化生成一个极其复杂的波普风格背景图案（模拟真实的五彩缤纷的App背板或者画廊画作）
  vec3 getBackground(vec2 uv) {
      // 整体背景随着外面的 u_scrollY 往下滚动，产生空间联动的错觉
      vec2 p = uv * 6.0;
      p.y -= u_scrollY * 3.0; // 滚动同步比例
      
      vec2 id = floor(p);
      vec2 f = fract(p);
      
      // 生成错落有致的发光圆球模拟相册
      float d = length(f - 0.5);
      float mask = smoothstep(0.45, 0.35, d);
      
      // 根据格子坐标随机生成鲜艳的色彩
      float rand = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
      vec3 col1 = vec3(1.0, 0.3, 0.4); // 红
      vec3 col2 = vec3(0.2, 0.6, 1.0); // 蓝
      vec3 col3 = vec3(1.0, 0.8, 0.1); // 黄
      vec3 col4 = vec3(0.1, 0.9, 0.5); // 绿
      
      vec3 iconCol = col1;
      if(rand > 0.25) iconCol = col2;
      if(rand > 0.50) iconCol = col3;
      if(rand > 0.75) iconCol = col4;
      
      // 网格底色
      float checker = mod(id.x + id.y, 2.0);
      vec3 bg = mix(vec3(0.95), vec3(0.85), checker);
      
      // 合成背景
      return mix(bg, iconCol, mask);
  }
  
  void main() {
      // 宽高比修正，保证屏幕不论多长，算出来的圆都是正圆，胶囊是完美胶囊
      float aspect = u_resolution.x / u_resolution.y;
      vec2 uv = v_uv;
      
      // 将坐标系归一化为 [-1, 1] 以屏幕中心为原点
      vec2 p = uv * 2.0 - 1.0;
      p.x *= aspect;
      
      // ======= 物理胶囊透镜参数 =======
      // 位置偏移，挪到屏幕底部模拟底部的浮动栏位置
      p.y += 0.8; 
      
      // 胶囊尺寸
      vec2 pillSize = vec2(0.35 * aspect, 0.08); 
      float radius = 0.08;
      
      // SDF 距离计算
      float d = sdRoundRect(p, pillSize, radius);
      
      vec2 refract_uv = uv;
      bool inside = d <= 0.0;
      
      float edgeThickness = 0.06; // 玻璃边缘厚度
      
      if (inside) {
          // 我们正在玻璃胶囊内部！开始光线追踪计算！
          
          float distToEdge = -d; // 距离边缘的距离 (0代表边缘，正数代表胶囊中心)
          
          // 极微小的微分位移用来计算法线（Normal）
          vec2 eps = vec2(0.005, 0.0);
          float dx = sdRoundRect(p + eps, pillSize, radius) - d;
          float dy = sdRoundRect(p + eps.yx, pillSize, radius) - d;
          vec2 normal = normalize(vec2(dx, dy));
          
          // 曲面厚度计算：越靠近边缘曲率越大，越中心越扁平
          float warpFactor = smoothstep(edgeThickness, 0.0, distToEdge);
          warpFactor = pow(warpFactor, 1.5); // 增加抛物线弧度
          
          // 神奇的折射率 (Refraction Strength)
          float strength = 0.05; 
          
          // 根据法线将 UV 推离或拉近，形成放大/缩小折射
          // 因为是从凸面看，物理上会将背后的光线聚合放大
          refract_uv -= normal * warpFactor * strength;
      }
      
      // 对修改后的偏移 UV 进行采样
      vec3 color = getBackground(refract_uv);
      
      // ======= 追加外壳高光和水晶倒影 =======
      if (inside) {
          float distToEdge = -d;
          float rim = smoothstep(edgeThickness, 0.0, distToEdge);
          
          // 模拟左上角打光
          vec2 lightDir = normalize(vec2(-1.0, 1.0)); // Y翻转后是 1.0 为顶部
          
          vec2 eps = vec2(0.01, 0.0);
          float dx = sdRoundRect(p + eps, pillSize, radius) - d;
          float dy = sdRoundRect(p + eps.yx, pillSize, radius) - d;
          vec2 normal = normalize(vec2(dx, dy));
          
          // 环境反射的高亮硬边 (Specular Highlight)
          float diffuse = max(dot(normal, lightDir), 0.0);
          float highlight = pow(diffuse, 8.0) * rim * 2.0;
          
          color = mix(color, vec3(1.0), highlight);
          
          // 右下角的环境反光
          float specular = pow(max(dot(normal, -lightDir), 0.0), 3.0) * rim * 0.4;
          color = mix(color, vec3(1.0), specular);
          
          // 增加一点玻璃固有的白冰感 (Tint)
          color = mix(color, vec3(1.0), 0.1);
          
          // 加上超级双实线光晕内框 (还原你的 1px double)
          float innerLine = smoothstep(0.005, 0.0, abs(distToEdge - 0.01)) + smoothstep(0.005, 0.0, abs(distToEdge - 0.018));
          color = mix(color, vec3(1.0), innerLine * 0.4);
      } else {
          // 外部加一个淡淡的环境投影
          float shadow = smoothstep(0.0, 0.15, d);
          color = mix(vec3(0.0), color, shadow);
      }
      
      gl_FragColor = vec4(color, 1.0);
  }
`;

Page({
  data: {
    scrollY: 0
  },

  onLoad() {
    this.initWebGL();
  },

  onReady() { },

  goBack() {
    wx.navigateBack();
  },

  onScroll(e) {
    const sY = e.detail.scrollTop / 500; // 换算比例
    this.data.scrollY = sY;
  },

  initWebGL() {
    const query = wx.createSelectorQuery();
    query.select('#glcanvas').node().exec((res) => {
      const canvas = res[0].node;
      const gl = canvas.getContext('webgl');
      if (!gl) {
        console.error('WebGL is not supported!');
        return;
      }
      
      // 适配高分屏
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = canvas._width * dpr;
      canvas.height = canvas._height * dpr;

      // 编译 Shader
      const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

      // 创建程序
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // 矩形顶点数据缓冲 (画一个占据整个画布的面)
      const vertices = new Float32Array([
        -1.0,  1.0,
        -1.0, -1.0,
         1.0,  1.0,
         1.0, -1.0,
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const aPosition = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      const uScrollY = gl.getUniformLocation(program, 'u_scrollY');
      const uResolution = gl.getUniformLocation(program, 'u_resolution');

      // 渲染循环
      const render = () => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 更新宽高比和滚动状态
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uScrollY, this.data.scrollY);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // 微信小程序 WebGL 提供了 requestAnimationFrame
        canvas.requestAnimationFrame(render);
      };
      
      render();
    });
  },

  compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
});
