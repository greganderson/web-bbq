import React, {Suspense} from "react";
import { Canvas } from "@react-three/fiber";
import MeatAnim from "./MeatAnim";
import styles from "./ThreeCanvas.module.css";
import { Vector3 } from "three";

interface BackgroundProps {
    isVisible: boolean
}

const Background: React.FC<BackgroundProps> = ({isVisible}) => {
    const MAX_MEAT = 30;
    const meats = [...Array(MAX_MEAT)].map(() => ({
        position: new Vector3(Math.floor(Math.random() * 20), Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)),
        speed: Math.random() + 1.5
    }));

    return (
        <div className={styles.canvas}>
            <Canvas orthographic camera={{position: [5, 0, 20], near: 0.1, far: 1000, zoom: 50}}>
                <Suspense fallback={null}>
                    {isVisible && (
                        <>
                            <ambientLight intensity={0.7} />
                            <directionalLight color="white" position={[0, 0, 5]} />
                            {meats.map((meat, i) => (
                                <MeatAnim key={i} position={meat.position} speed={meat.speed} />
                            ))}
                        </>
                    )}
                </Suspense>
            </Canvas>
        </div>
    )
}

const MemoBackground = React.memo(Background);

export default MemoBackground;