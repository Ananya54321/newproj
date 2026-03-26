const dogLoaderCss = `
  .dog-loader-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  .dog-loader-wrapper .main {
    position: relative;
    width: 23.5vmax;
    height: 23.5vmax;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .dog-loader-wrapper .leg {
    position: absolute;
    bottom: 0;
    width: 2vmax;
    height: 2.125vmax;
  }
  .dog-loader-wrapper .paw {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1.95vmax;
    height: 1.875vmax;
    overflow: hidden;
  }
  .dog-loader-wrapper .paw::before {
    content: "";
    position: absolute;
    width: 3.75vmax;
    height: 3.75vmax;
    border-radius: 50%;
  }
  .dog-loader-wrapper .top {
    position: absolute;
    bottom: 0;
    left: 0.75vmax;
    height: 4.5vmax;
    width: 2.625vmax;
    border-top-left-radius: 1.425vmax;
    border-top-right-radius: 1.425vmax;
    transform-origin: bottom right;
    transform: rotateZ(90deg) translateX(-0.1vmax) translateY(1.5vmax);
    z-index: -1;
    background-image: linear-gradient(70deg, transparent 20%, #ff8b56 20%);
  }
  .dog-loader-wrapper .dog {
    position: relative;
    width: 22.5vmax;
    height: 8.25vmax;
  }
  .dog-loader-wrapper .dog::before {
    content: "";
    position: absolute;
    bottom: -0.75vmax;
    right: -0.15vmax;
    width: 100%;
    height: 1.5vmax;
    background-color: rgba(28, 49, 48, 0.1);
    border-radius: 50%;
    z-index: -1000;
    animation: dl-shadow 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__head {
    position: absolute;
    left: 4.5vmax;
    bottom: 0;
    width: 9.75vmax;
    height: 8.25vmax;
    border-top-left-radius: 4.05vmax;
    border-top-right-radius: 4.05vmax;
    border-bottom-right-radius: 3.3vmax;
    border-bottom-left-radius: 3.3vmax;
    background-color: #ff8147;
    animation: dl-head 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
    z-index: 3;
  }
  .dog-loader-wrapper .dog__head-c {
    position: absolute;
    left: 1.5vmax;
    bottom: 0;
    width: 9.75vmax;
    height: 8.25vmax;
    animation: dl-head 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
    z-index: 1;
  }
  .dog-loader-wrapper .dog__snout {
    position: absolute;
    left: -1.5vmax;
    bottom: 0;
    width: 7.5vmax;
    height: 3.75vmax;
    border-top-right-radius: 3vmax;
    border-bottom-right-radius: 3vmax;
    border-bottom-left-radius: 4.5vmax;
    background-color: #d7dbd2;
    animation: dl-snout 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__snout::before {
    content: "";
    position: absolute;
    left: -0.1125vmax;
    top: -0.15vmax;
    width: 1.875vmax;
    height: 1.125vmax;
    border-top-right-radius: 3vmax;
    border-bottom-right-radius: 3vmax;
    border-bottom-left-radius: 4.5vmax;
    background-color: #1c3130;
    animation: dl-snout-b 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__nose {
    position: absolute;
    top: -1.95vmax;
    left: 40%;
    width: 0.75vmax;
    height: 2.4vmax;
    border-radius: 0.525vmax;
    transform-origin: bottom;
    transform: rotateZ(10deg);
    background-color: #d7dbd2;
  }
  .dog-loader-wrapper .dog__eye-l,
  .dog-loader-wrapper .dog__eye-r {
    position: absolute;
    top: -0.9vmax;
    width: 0.675vmax;
    height: 0.375vmax;
    border-radius: 50%;
    background-color: #1c3130;
    animation: dl-eye 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__eye-l { left: 27%; }
  .dog-loader-wrapper .dog__eye-r { left: 65%; }
  .dog-loader-wrapper .dog__ear-l,
  .dog-loader-wrapper .dog__ear-r {
    position: absolute;
    width: 10.5vmax;
    height: 3.375vmax;
    border-top-left-radius: 0vmax;
    border-top-right-radius: 0vmax;
    border-bottom-right-radius: 3.3vmax;
    border-bottom-left-radius: 3.3vmax;
    background-color: #e26538;
  }
  .dog-loader-wrapper .dog__ear-l {
    top: 1.5vmax;
    left: 6vmax;
    transform-origin: bottom left;
    transform: rotateZ(-50deg);
    z-index: 1;
    animation: dl-ear-l 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__ear-r {
    top: 1.5vmax;
    right: 3vmax;
    transform-origin: bottom right;
    transform: rotateZ(20deg);
    z-index: 1;
    animation: dl-ear-r 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__body {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    position: absolute;
    bottom: 0.3vmax;
    left: 3.75vmax;
    width: 18.75vmax;
    height: 7.2vmax;
    border-top-left-radius: 3vmax;
    border-top-right-radius: 6vmax;
    border-bottom-right-radius: 1.5vmax;
    border-bottom-left-radius: 6vmax;
    background-color: #ff702e;
    z-index: 2;
    animation: dl-body 10s cubic-bezier(0.3, 0.41, 0.18, 1.01) infinite;
  }
  .dog-loader-wrapper .dog__tail {
    position: absolute;
    right: -3vmax;
    height: 1.5vmax;
    width: 4.5vmax;
    background-color: #e96839;
    border-radius: 1.5vmax;
  }
  .dog-loader-wrapper .dog__paws {
    position: absolute;
    bottom: 0;
    left: 7.5vmax;
    width: 12vmax;
    height: 3vmax;
  }
  .dog-loader-wrapper .dog__paws-front {
    position: absolute;
    bottom: 0;
    left: 7.5vmax;
    width: 12vmax;
    height: 3vmax;
    z-index: 4;
  }
  .dog-loader-wrapper .dog__bl-leg { left: -3vmax; z-index: 0; }
  .dog-loader-wrapper .dog__bl-paw::before { background-color: #bec4b6; }
  .dog-loader-wrapper .dog__bl-top { background-image: linear-gradient(80deg, transparent 20%, #e96839 20%); }
  .dog-loader-wrapper .dog__fl-leg { z-index: 4; left: 0; }
  .dog-loader-wrapper .dog__fl-paw::before { background-color: #d7dbd2; }
  .dog-loader-wrapper .dog__fl-top { background-image: linear-gradient(70deg, transparent 20%, #ff8b56 20%); }
  .dog-loader-wrapper .dog__fr-leg { right: 0; z-index: -1; }
  .dog-loader-wrapper .dog__fr-paw::before { background-color: #d7dbd2; }
  .dog-loader-wrapper .dog__fr-top { background-image: linear-gradient(70deg, transparent 20%, #ff8b56 20%); }

  @keyframes dl-head {
    0%, 10%, 20%, 26%, 28%, 90%, 100% { height: 8.25vmax; bottom: 0; transform-origin: bottom right; transform: rotateZ(0); }
    5%, 15%, 22%, 24%, 30% { height: 8.1vmax; }
    32%, 50% { height: 8.25vmax; }
    55%, 60% { bottom: 0.75vmax; transform-origin: bottom right; transform: rotateZ(0); }
    70%, 80% { bottom: 0.75vmax; transform-origin: bottom right; transform: rotateZ(10deg); }
  }
  @keyframes dl-body {
    0%, 10%, 20%, 26%, 28%, 32%, 100% { height: 7.2vmax; }
    5%, 15%, 22%, 24%, 30% { height: 7.05vmax; }
  }
  @keyframes dl-ear-l {
    0%, 10%, 20%, 26%, 28%, 82%, 100% { transform: rotateZ(-50deg); }
    5%, 15%, 22%, 24% { transform: rotateZ(-48deg); }
    30%, 31% { transform: rotateZ(-30deg); }
    32%, 80% { transform: rotateZ(-60deg); }
  }
  @keyframes dl-ear-r {
    0%, 10%, 20%, 26%, 28% { transform: rotateZ(20deg); }
    5%, 15%, 22%, 24% { transform: rotateZ(18deg); }
    30%, 31% { transform: rotateZ(10deg); }
    32% { transform: rotateZ(25deg); }
  }
  @keyframes dl-snout {
    0%, 10%, 20%, 26%, 28%, 82%, 100% { height: 3.75vmax; }
    5%, 15%, 22%, 24% { height: 3.45vmax; }
  }
  @keyframes dl-snout-b {
    0%, 10%, 20%, 26%, 28%, 98%, 100% { width: 1.875vmax; }
    5%, 15%, 22%, 24% { width: 1.8vmax; }
    34%, 98% { width: 1.275vmax; }
  }
  @keyframes dl-shadow {
    0%, 10%, 20%, 26%, 28%, 30%, 84%, 100% { width: 99%; }
    5%, 15%, 22%, 24% { width: 101%; }
    34%, 81% { width: 96%; }
  }
  @keyframes dl-eye {
    0%, 30% { width: 0.675vmax; height: 0.3vmax; }
    32%, 59%, 90%, 100% { width: 0.525vmax; height: 0.525vmax; transform: translateY(0); }
    60%, 75% { transform: translateY(-0.3vmax); }
    80%, 85% { transform: translateY(0.15vmax); }
  }
`

export default function DogLoader() {
  return (
    <div className="dog-loader-wrapper">
      <style dangerouslySetInnerHTML={{ __html: dogLoaderCss }} />
      <div className="main">
        <div className="dog">
          <div className="dog__paws">
            <div className="dog__fr-leg leg">
              <div className="dog__fr-paw paw" />
              <div className="dog__fr-top top" />
            </div>
            <div className="dog__bl-leg leg">
              <div className="dog__bl-paw paw" />
              <div className="dog__bl-top top" />
            </div>
          </div>
          <div className="dog__body">
            <div className="dog__tail" />
          </div>
          <div className="dog__head-c">
            <div className="dog__ear-l" />
            <div className="dog__ear-r" />
          </div>
          <div className="dog__head">
            <div className="dog__snout">
              <div className="dog__nose" />
              <div className="dog__eyes">
                <div className="dog__eye-l" />
                <div className="dog__eye-r" />
              </div>
            </div>
          </div>
          <div className="dog__paws-front">
            <div className="dog__fl-leg leg">
              <div className="dog__fl-paw paw" />
              <div className="dog__fl-top top" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
