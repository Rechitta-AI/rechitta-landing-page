// Apple Vision subject-lift matte: in.jpg -> out.png (RGBA, background removed)
// Usage: swift vision-matte.swift <input> <output>
import Vision
import CoreImage
import Foundation

let inURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outURL = URL(fileURLWithPath: CommandLine.arguments[2])

let handler = VNImageRequestHandler(url: inURL)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else {
    FileHandle.standardError.write("NO SUBJECT FOUND\n".data(using: .utf8)!)
    exit(2)
}
let buffer = try result.generateMaskedImage(
    ofInstances: result.allInstances,
    from: handler,
    croppedToInstancesExtent: false)
let image = CIImage(cvPixelBuffer: buffer)
let ctx = CIContext()
try ctx.writePNGRepresentation(
    of: image, to: outURL, format: .RGBA8,
    colorSpace: image.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB)!)
print("ok \(Int(image.extent.width))x\(Int(image.extent.height))")
