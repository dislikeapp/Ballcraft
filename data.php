<?php

function isValid($name) {
	return ($name != '.' && $name != '..');
}
function isFile($path) {
	$dot = strrpos($path, ".");
	return !($dot === FALSE);
}
function getFileName($file) {
	$dot = strrpos($file, ".");
	return substr($file, 0, $dot);
}

$filePath = $_GET["path"];

if ($filePath != NULL) {
	$files = array();
	$ary = scandir($filePath);
	foreach ($ary as $file) {
		if (isValid($file) && isFile($file)) {
			$name = getFileName($file);
			$files[$name] = ($filePath.'/'.$file);
		}
	}
	echo stripslashes(json_encode($files));
}

?>