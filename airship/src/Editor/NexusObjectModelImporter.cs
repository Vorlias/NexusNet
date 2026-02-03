using System.IO;
using System.Linq;
using UnityEditor.AssetImporters;
using UnityEngine;

[ScriptedImporter(2, "nom")]
public class NexusObjectModelImporter : ScriptedImporter {
    public override void OnImportAsset(AssetImportContext ctx) {
        var test = ctx.assetPath.Split('/');

        if (test.Contains("Resources")) {
            Debug.LogWarning("Network Object Models cannot be in the Resources folder");
            return;
        }
        
        var networkObjectModel = ScriptableObject.CreateInstance<NetworkObjectModel>();
        ctx.AddObjectToAsset(ctx.assetPath, networkObjectModel);
        ctx.SetMainObject(networkObjectModel);
    }
}