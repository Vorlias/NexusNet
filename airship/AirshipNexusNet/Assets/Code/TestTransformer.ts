import { float32, float64, int32, uint8 } from "@Vorlias/NexusNet/Core/Buffers";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusX } from "@Vorlias/NexusNet/Framework/NexusX";

NexusX.RegisterType(NexusTypes.Identity);
const example = Nexus.Client(
	"test",
	NexusX.Event<[name: string, name2: int32, test3: float64]>()
		.SetUseBuffer(true)
		.WithClientFilter((player) => player.orgRoleName !== undefined),
);
const example2 = Nexus.Event(NexusTypes.Int32);
