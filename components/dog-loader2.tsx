const dogLoader2Css = `
  .dog-loader2-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  .dog-loader2-wrapper .main {
    position: relative;
    width: 23.5vmax;
    height: 23.5vmax;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .dog-loader2-wrapper .leg {
    position: absolute;
    bottom: 0;
    width: 2vmax;
    height: 2.125vmax;
  }
  .dog-loader2-wrapper .paw {
    position: absolute;
    bottom: 2px;
    left: 0;
    width: 1.95vmax;
    height: 1.8vmax;
    overflow: hidden;
  }
  .dog-loader2-wrapper .paw::before {
    content: "";
    position: absolute;
    width: 5vmax;
    height: 3vmax;
    border-radius: 50%;
  }
  .dog-loader2-wrapper .top {
    position: absolute;
    bottom: 0;
    left: 0.75vmax;
    height: 4.5vmax;
    width: 2.625vmax;
    border-top-left-radius: 1.425vmax;
    border-top-right-radius: 1.425vmax;
    transform-origin: bottom right;
    transform: rotateZ(90deg) translateX(-0.1vmax) translateY(1.5vmax);
    z-index: 1;
    background-image: linear-gradient(70deg, transparent 20%, #deac80 20%);
  }
  .dog-loader2-wrapper .dog {
    position: relative;
    width: 20vmax;
    height: 8vmax;
    z-index: 1;
  }
  .dog-loader2-wrapper .dog::before {
    content: "";
    position: absolute;
    bottom: -0.75vmax;
    right: -0.15vmax;
    width: 100%;
    height: 1.5vmax;
    background-color: #b5c18e;
    border-radius: 50%;
    z-index: 0;
    animation: dl2-shadow 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__head {
    position: absolute;
    left: 4.5vmax;
    bottom: 0;
    width: 8vmax;
    height: 5vmax;
    border-top-left-radius: 4.05vmax;
    border-top-right-radius: 4.05vmax;
    border-bottom-right-radius: 3.3vmax;
    border-bottom-left-radius: 3.3vmax;
    background-color: #deac80;
    animation: dl2-head 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
    z-index: 5;
  }
  .dog-loader2-wrapper .dog__head-c {
    position: absolute;
    left: 1.5vmax;
    bottom: 0;
    width: 9.75vmax;
    height: 8.25vmax;
    animation: dl2-head 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
    z-index: 4;
  }
  .dog-loader2-wrapper .dog__snout {
    position: absolute;
    left: -1.5vmax;
    bottom: 0;
    width: 7.5vmax;
    height: 3.75vmax;
    border-top-right-radius: 3vmax;
    border-bottom-right-radius: 3vmax;
    border-bottom-left-radius: 4.5vmax;
    background-color: #f7dcb9;
    animation: dl2-snout 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__snout::before {
    content: "";
    position: absolute;
    left: -0.1125vmax;
    top: -0.15vmax;
    width: 1.875vmax;
    height: 1.125vmax;
    border-top-right-radius: 3vmax;
    border-bottom-right-radius: 3vmax;
    border-bottom-left-radius: 4.5vmax;
    background-color: #6c4e31;
    animation: dl2-snout-b 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__eye-l,
  .dog-loader2-wrapper .dog__eye-r {
    position: absolute;
    top: -0.9vmax;
    width: 0.675vmax;
    height: 0.375vmax;
    border-radius: 50%;
    background-color: #1c3130;
    animation: dl2-eye 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__eye-l { left: 27%; }
  .dog-loader2-wrapper .dog__eye-r { left: 65%; }
  .dog-loader2-wrapper .dog__ear-l,
  .dog-loader2-wrapper .dog__ear-r {
    position: absolute;
    width: 5vmax;
    height: 3.3vmax;
    border-top-left-radius: 3.3vmax;
    border-top-right-radius: 3vmax;
    border-bottom-right-radius: 5vmax;
    border-bottom-left-radius: 5vmax;
    background-color: #deac80;
  }
  .dog-loader2-wrapper .dog__ear-l {
    top: 1.5vmax;
    left: 10vmax;
    transform-origin: bottom left;
    transform: rotateZ(-50deg);
    z-index: 3;
    animation: dl2-ear-l 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__ear-r {
    top: 1.5vmax;
    right: 3vmax;
    transform-origin: bottom right;
    transform: rotateZ(25deg);
    z-index: 3;
    animation: dl2-ear-r 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__body {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    position: absolute;
    bottom: 0.3vmax;
    left: 6vmax;
    width: 18vmax;
    height: 4vmax;
    border-top-left-radius: 3vmax;
    border-top-right-radius: 6vmax;
    border-bottom-right-radius: 1.5vmax;
    border-bottom-left-radius: 6vmax;
    background-color: #914f1e;
    z-index: 4;
    animation: dl2-body 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader2-wrapper .dog__tail {
    position: absolute;
    top: 20px;
    right: -1.5vmax;
    height: 3vmax;
    width: 4vmax;
    background-color: #914f1e;
    border-radius: 1.5vmax;
  }
  .dog-loader2-wrapper .dog__paws {
    position: absolute;
    bottom: 0;
    left: 7.5vmax;
    width: 10vmax;
    height: 3vmax;
    z-index: 6;
  }
  .dog-loader2-wrapper .dog__bl-leg { left: -3vmax; z-index: 2; }
  .dog-loader2-wrapper .dog__bl-paw::before { background-color: #fffbe6; }
  .dog-loader2-wrapper .dog__bl-top { background-image: linear-gradient(80deg, transparent 20%, #deac80 20%); }
  .dog-loader2-wrapper .dog__fl-leg { z-index: 6; left: 0; }
  .dog-loader2-wrapper .dog__fl-paw::before { background-color: #fffbe6; }
  .dog-loader2-wrapper .dog__fr-leg { right: 0; z-index: 2; }
  .dog-loader2-wrapper .dog__fr-paw::before { background-color: #fffbe6; }

  @keyframes dl2-head {
    0%, 10%, 20%, 26%, 28%, 90%, 100% { height: 8.25vmax; bottom: 0; transform-origin: bottom right; transform: rotateZ(0); }
    5%, 15%, 22%, 24%, 30% { height: 8.1vmax; }
    32%, 50% { height: 8.25vmax; }
    55%, 60% { bottom: 0.75vmax; transform-origin: bottom right; transform: rotateZ(0); }
    70%, 80% { bottom: 0.75vmax; transform-origin: bottom right; transform: rotateZ(10deg); }
  }
  @keyframes dl2-body {
    0%, 10%, 20%, 26%, 28%, 32%, 100% { height: 7.2vmax; }
    5%, 15%, 22%, 24%, 30% { height: 7.05vmax; }
  }
  @keyframes dl2-ear-l {
    0%, 10%, 20%, 26%, 28%, 82%, 100% { transform: rotateZ(-50deg); }
    5%, 15%, 22%, 24% { transform: rotateZ(-48deg); }
    30%, 31% { transform: rotateZ(-30deg); }
    32%, 80% { transform: rotateZ(-60deg); }
  }
  @keyframes dl2-ear-r {
    0%, 10%, 20%, 26%, 28% { transform: rotateZ(20deg); }
    5%, 15%, 22%, 24% { transform: rotateZ(18deg); }
    30%, 31% { transform: rotateZ(10deg); }
    32% { transform: rotateZ(25deg); }
  }
  @keyframes dl2-snout {
    0%, 10%, 20%, 26%, 28%, 82%, 100% { height: 3.75vmax; }
    5%, 15%, 22%, 24% { height: 3.45vmax; }
  }
  @keyframes dl2-snout-b {
    0%, 10%, 20%, 26%, 28%, 98%, 100% { width: 1.875vmax; }
    5%, 15%, 22%, 24% { width: 1.8vmax; }
    34%, 98% { width: 1.275vmax; }
  }
  @keyframes dl2-shadow {
    0%, 10%, 20%, 26%, 28%, 30%, 84%, 100% { width: 99%; }
    5%, 15%, 22%, 24% { width: 101%; }
    34%, 81% { width: 96%; }
  }
  @keyframes dl2-eye {
    0%, 30% { width: 0.675vmax; height: 0.3vmax; }
    32%, 59%, 90%, 100% { width: 0.525vmax; height: 0.525vmax; transform: translateY(0); }
    60%, 75% { transform: translateY(-0.3vmax); }
    80%, 85% { transform: translateY(0.15vmax); }
  }
`

export default function DogLoader2() {
  return (
    <div className="dog-loader2-wrapper">
      <style dangerouslySetInnerHTML={{ __html: dogLoader2Css }} />
      <div className="main">
        <div className="dog">
          <div className="dog__paws">
            <div className="dog__bl-leg leg">
              <div className="dog__bl-paw paw" />
              <div className="dog__bl-top top" />
            </div>
            <div className="dog__fl-leg leg">
              <div className="dog__fl-paw paw" />
              <div className="dog__fl-top top" />
            </div>
            <div className="dog__fr-leg leg">
              <div className="dog__fr-paw paw" />
              <div className="dog__fr-top top" />
            </div>
          </div>
          <div className="dog__body">
            <div className="dog__tail" />
          </div>
          <div className="dog__head">
            <div className="dog__snout">
              <div className="dog__eyes">
                <div className="dog__eye-l" />
                <div className="dog__eye-r" />
              </div>
            </div>
          </div>
          <div className="dog__head-c">
            <div className="dog__ear-r" />
            <div className="dog__ear-l" />
          </div>
        </div>
      </div>
    </div>
  )
}
