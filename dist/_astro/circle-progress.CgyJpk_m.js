import{r as x,i as n}from"./lit-element.CdPzzhzS.js";import{x as g}from"./lit-html.Cs9YtZST.js";import{t as v}from"./custom-element.BhZVzxrc.js";import{n as a}from"./property.a2FlD-39.js";var b=Object.defineProperty,y=Object.getOwnPropertyDescriptor,i=(e,t,s,h)=>{for(var o=h>1?void 0:h?y(t,s):t,l=e.length-1,d;l>=0;l--)(d=e[l])&&(o=(h?d(t,s,o):d(o))||o);return h&&o&&b(t,s,o),o};class r extends x{constructor(){super(...arguments),this.value=0,this.centerColor="transparent",this.bgColor="#e0e0e0",this.activeColor="#007bff",this.radius=100,this.strokeWidth=10,this.text=""}static{this.styles=n`
    :host {
      display: inline-block;
      position: relative;
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .text {
      position: absolute;
      top: 50%;
      left: 50%;
      font-family: sans-serif;
      font-size: 1.2rem;
      font-weight: bold;
      pointer-events: none;
      text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
    }
  `}firstUpdated(){this.setAttribute("role","progressbar"),this.updateDimensions()}updated(t){(t.has("radius")||t.has("strokeWidth"))&&this.updateDimensions()}getValue(){return this.value}setValue(t,s=!0){this.value=Math.max(0,Math.min(100,t)),s&&(this.text=t+"%")}setText(t){this.text=t}getText(){return this.text}setActiveColor(t){this.activeColor=t}setCenterColor(t){this.centerColor=t}setBgColor(t){this.bgColor=t}setStrokeWidth(t){this.strokeWidth=t,this.updateDimensions()}setRadius(t){this.radius=t,this.updateDimensions()}getProgressPercentage(){return Math.max(0,Math.min(100,this.value))}}i([a({type:Number})],r.prototype,"value",2);i([a({type:String,attribute:"center-color"})],r.prototype,"centerColor",2);i([a({type:String,attribute:"bg-color"})],r.prototype,"bgColor",2);i([a({type:String,attribute:"active-color"})],r.prototype,"activeColor",2);i([a({type:Number})],r.prototype,"radius",2);i([a({type:Number})],r.prototype,"strokeWidth",2);i([a({type:String})],r.prototype,"text",2);let c=class extends r{updateDimensions(){this.style.width=`${this.radius}px`,this.style.height=`${this.radius}px`}getCircumference(){return(this.radius/2-this.strokeWidth/2)*2*Math.PI}calculateStrokeDashArray(e){const t=this.getCircumference(),s=t*e/100;return`${s} ${t-s}`}render(){const e=this.radius/2-this.strokeWidth/2,t=this.calculateStrokeDashArray(this.value),s=this.radius/2;return g`
      <div class="container">
        <svg width="100%" height="100%" viewBox="0 0 ${this.radius} ${this.radius}">
          <!-- Center circle (can be transparent) -->
          <circle 
            cx="${s}" 
            cy="${s}" 
            r="${e-this.strokeWidth/2}" 
            fill="${this.centerColor}" 
          />
          
          <!-- Background circle -->
          <circle 
            cx="${s}" 
            cy="${s}" 
            r="${e}" 
            fill="none"
            stroke="${this.bgColor}" 
            stroke-width="${this.strokeWidth}" 
          />
          
          <!-- Progress circle -->
          <circle 
            cx="${s}" 
            cy="${s}" 
            r="${e}" 
            fill="none" 
            stroke="${this.activeColor}" 
            stroke-width="${this.strokeWidth}" 
            stroke-dasharray="${t}"
            stroke-dashoffset="0"
            transform="rotate(-90 ${s} ${s})"
          />
        </svg>
        <span class="text">${this.text||this.value+"%"}</span>
      </div>
    `}};c.styles=n`
    ${r.styles}
    .text {
      transform: translate(-50%, -50%);
    }
  `;c=i([v("circle-progress")],c);let p=class extends r{updateDimensions(){this.style.height=`${this.strokeWidth}pt`}setWidth(e){this.setRadius(e)}setHeight(e){this.setStrokeWidth(e)}render(){return g`
      <div class="container">
        <div 
          class="background" 
          style="background-color: ${this.bgColor}"
        ></div>
        <div 
          class="progress" 
          style="
            width: ${this.getProgressPercentage()}%; 
            background-color: ${this.activeColor};
          "
        ></div>
        <span class="text">${this.text||this.value+"%"}</span>
      </div>
    `}};p.styles=n`
    ${r.styles}
    .container {
      border-radius: 10px;
      overflow: hidden;
    }
    .background {
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }
    .progress {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
      position: absolute;
      top: 0;
      left: 0;
    }
    .text {
      transform: translate(-50%, -50%);
      font-size: small;
      color: black; 
    }
  `;p=i([v("horizontal-progress")],p);let u=class extends r{updateDimensions(){this.style.width=`${this.strokeWidth}px`,this.style.height=`${this.radius}px`}setWidth(e){this.setStrokeWidth(e)}setHeight(e){this.setRadius(e)}render(){return g`
      <div class="container">
        <div 
          class="background" 
          style="background-color: ${this.bgColor}"
        ></div>
        <div 
          class="progress" 
          style="
            height: ${this.getProgressPercentage()}%; 
            background-color: ${this.activeColor};
          "
        ></div>
        <span class="text">${this.text||this.value+"%"}</span>
      </div>
    `}};u.styles=n`
    ${r.styles}
    .container {
      border-radius: 10px;
      overflow: hidden;
    }
    .background {
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }
    .progress {
      width: 100%;
      border-radius: 10px;
      transition: height 0.3s ease;
      position: absolute;
      bottom: 0;
      left: 0;
    }
    .text {
      transform: translate(-50%, -50%) rotate(-90deg);
      white-space: nowrap;
    }
  `;u=i([v("vertical-progress")],u);
