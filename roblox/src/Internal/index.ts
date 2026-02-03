const RunService = game.GetService("RunService");
const ReplicatedStorage = game.GetService("ReplicatedStorage");

let remotes: Folder;
if (game.GetService("RunService").IsServer()) {
	remotes = new Instance("Folder");
	remotes.Name = "NexusNet";
	remotes.Parent = ReplicatedStorage;
} else {
	const remoteInstance = ReplicatedStorage.WaitForChild("NexusNet");
	assert(remoteInstance.IsA("Folder"));
	remotes = remoteInstance;
}

export const RemotesFolder = remotes;
