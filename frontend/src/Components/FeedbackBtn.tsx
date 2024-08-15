import React from "react";
import { TablerIcon } from "@tabler/icons-react";
import { ActionIcon, HoverCard, Text } from "@mantine/core";

interface FeedbackBtnProps {
	id: number,
	highlighted: number,
	color: string,
	text: string,
	Icon: TablerIcon,
	clickHandler: () => void
}

const FeedbackBtn: React.FC<FeedbackBtnProps> = ({ id, highlighted, color, text, Icon, clickHandler }) => {
	let highlight = id === highlighted ? "filled" : "outline"
	return (
		<HoverCard width={180} shadow="md">
			<HoverCard.Target>
				<ActionIcon
					onClick={clickHandler}
					variant={highlight}
					size="xl"
					color={color}>
					<Icon />
				</ActionIcon>
			</HoverCard.Target>
			<HoverCard.Dropdown>
				<Text size="xs">
					{text}
				</Text>
			</HoverCard.Dropdown>
		</HoverCard>
	)
}

export default FeedbackBtn;
