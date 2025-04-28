import Nexus from ".";
import NetV3Compat from "./Compat/Net3";

const NetV4Compat = Nexus.Net4;

const test = NetV4Compat.BuildDefinition()
	.AddServerOwned("test", NetV4Compat.Remote())
	.AddNamespace(
		"Inner",
		NetV4Compat.BuildDefinition()
			.AddServerOwned("Inner", NetV4Compat.Remote())
			.AddNamespace(
				"InnerInner",
				NetV4Compat.BuildDefinition().AddServerOwned("InnerInner", NetV4Compat.Remote()),
			),
	)
	.AddClientOwned("test2", NetV4Compat.Remote())
	.Build();
const test2 = test.GetNamespace("Inner").GetNamespace("InnerInner");
test.GetNamespace("Inner").Get("Inner");

const test3 = NetV4Compat.Remote()
	.WhichReturnsAsync(NetV4Compat.Types.Color3)
	.WithArguments(NetV4Compat.Types.set(NetV4Compat.Types.str));
