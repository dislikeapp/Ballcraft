<?php

$filePath = $_POST["path"];
$text = $_POST["text"];

if ($filePath != NULL && $text != NULL) {
	$fp = fopen("save/".$filePath, "w");
	fwrite($fp, $text);
	fclose($fp);
}

?>