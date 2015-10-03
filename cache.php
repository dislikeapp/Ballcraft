<?php

$filePath = $_GET["path"];

if ($filePath != NULL) {
	if ($file_exists($filePath) {
		$content = file_get_contents($filePath);
		header("Cache-Control: public");
		header("Last-Modified: public");
		echo $content;
	}
}

?>