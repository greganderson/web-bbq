import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Meat } from "./Meat.tsx";
import { Vector3, Group } from "three";

interface BoxProps {
	position: Vector3;
	speed: number;
}

const MeatAnim: React.FC<BoxProps> = ({ position, speed }) => {
	const meshRef = useRef<Group>(null);

	useFrame(({ clock }) => {
		const mesh = meshRef.current;
		if (mesh) {
			// Rotate the model over time
			mesh.rotation.x = clock.getElapsedTime() / speed;
			mesh.rotation.y = clock.getElapsedTime() / speed;
			mesh.rotation.z = clock.getElapsedTime() / speed;

			// Apply downward movement based on speed
			mesh.position.y -= 0.1 / speed;

			// Reset position if it falls below a certain threshold
			if (mesh.position.y < -20) {
				mesh.position.y = 10;
				mesh.position.x = Math.floor(Math.random() * 21) - 10;
			}
		}
	});

	return (
		<group ref={meshRef} position={position}>
			<Meat />
		</group>
	);
};

export default MeatAnim;