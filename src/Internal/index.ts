const RunService = game.GetService("RunService");
const ReplicatedStorage = game.GetService("ReplicatedStorage");

let remotes: Folder;
const RemotesFolderName = "_Nexus";
if (game.GetService("RunService").IsServer()) {
	remotes = new Instance("Folder");
	remotes.Name = RemotesFolderName;
	remotes.Parent = ReplicatedStorage;
} else {
	const remoteInstance = ReplicatedStorage.WaitForChild(RemotesFolderName);
	assert(remoteInstance.IsA("Folder"));
	remotes = remoteInstance;
}

export const RemotesFolder = remotes;
