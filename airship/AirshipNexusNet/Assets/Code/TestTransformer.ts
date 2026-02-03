import { float32, float64, int32, uint8 } from "@Vorlias/NexusNet/Core/Buffers";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusX } from "@Vorlias/NexusNet/Framework/NexusX";

const nid = NexusTypes.Identity;

NexusX.RegisterType(NexusTypes.Identity);

const evt = NexusX.Event<[name: string, name2: int32, test3: float64, test4: NetworkIdentity]>().SetUseBuffer(true);

const example = Nexus.Client("test", evt);
NexusX.UserTypes