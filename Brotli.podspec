require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Brotli"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/nainglynndw/react-native-brotli.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{h,m,mm,swift,cpp}",
    "cpp/brotli/c/common/*.{c,h}",
    "cpp/brotli/c/enc/*.{c,h}",
    "cpp/brotli/c/include/brotli/*.h"
  ]
  s.private_header_files = "ios/**/*.h"
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/brotli/c/include\""
  }

  s.libraries    = "compression"

  install_modules_dependencies(s)
end
