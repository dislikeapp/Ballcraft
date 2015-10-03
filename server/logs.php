<?php

function eat(&$arr) {
	return array_shift($arr);
}

function convertBash($bash) {
	$colors = array(
		'#000000', '#7F0000', '#007F00', '#7F7F00', '#00007F', '#7F007F', '#007F7F', '#BFBFBF',
		'#4F4F4F', '#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'
	);
	
	$html = $bash;
	$done = FALSE;
	$depth = 0;
	while (!$done) {
		$esc = strpos($html, '[');
		if ($esc === FALSE) {
			$done = TRUE;
			break;
		}
		
		$attribs = array(
			'bold'			=> FALSE, 'dim'			=> FALSE,
			'underline'		=> FALSE, 'blink'		=> FALSE,
			'invert'		=> FALSE, 'hidden'		=> FALSE,
			'foreground'	=> FALSE, 'background'	=> FALSE
		);
		
		$insertion = '';
		$m = strpos($html, 'm', $esc);
		
		$inside = '0';
		if ($m-$esc > 2) {
			$inside = substr($html, $esc+2, $m-$esc-2);
		}
		$codes = split(";", $inside);
		for ($i=0; $i<sizeof($codes);$i++)
			$codes[$i] = intval($codes[$i]);
		
		while (sizeof($codes) > 0) {
			$cmd = eat($codes);
			switch ($cmd) {
				case 0: {
					$attribs['bold'] = FALSE;
					$attribs['dim'] = FALSE;
					$attribs['underline'] = FALSE;
					$attribs['blink'] = FALSE;
					$attribs['invert'] = FALSE;
					$attribs['hidden'] = FALSE;
					$attribs['foreground'] = FALSE;
					$attribs['background'] = FALSE;
				}
				case 1: $attribs['bold'] = TRUE;
				case 2: $attribs['dim'] = TRUE;
				case 4: $attribs['underline'] = TRUE;
				case 5: $attribs['blink'] = TRUE;
				case 7: $attribs['invert'] = TRUE;
				case 8: $attribs['hidden'] = TRUE;
				case 21: $attribs['bold'] = FALSE;
				case 22: $attribs['dim'] = FALSE;
				case 24: $attribs['underline'] = FALSE;
				case 25: $attribs['blink'] = FALSE;
				case 27: $attribs['invert'] = FALSE;
				case 28: $attribs['hidden'] = FALSE;
				case 39: $attribs['foreground'] = FALSE;
				case 49: $attribs['background'] = FALSE;
			}
			if ($cmd >= 30 && $cmd < 38) $attribs['foreground'] = $colors[$cmd - 30];
			if ($cmd >= 40 && $cmd < 48) $attribs['background'] = $colors[$cmd - 40];
			if ($cmd >= 90 && $cmd < 98) $attribs['foreground'] = $colors[$cmd - 90 + 8];
			if ($cmd >= 100 && $cmd < 108) $attribs['background'] = $colors[$cmd - 100 + 8];
			
			if ($cmd == 38 || $cmd == 48) {
				$type = eat($codes);
				$col = '';
				if ($type == 2) {
					$col256 = eat($codes);
					$col256 = array(
						(($col256 >> 5) & 7)*1.0 / 7.0,
						(($col256 >> 2) & 7)*1.0 / 7.0,
						(($col256 >> 0) & 3)*1.0 / 3.0);
					for ($i = 0; $i < 3; $i++) {
						$bit = ($col256 >> $i) & 1;
						$c = dechex(intval(round($col256[$i] * 255.0)));
						if (strlen($c) < 2) $c = '0'.$c;
						$col .= $c;
					}
					$col = '#'.$col;
				}
				else if ($type == 5) {
					for ($i = 0; $i < 3; $i++) {
						$c = dechex(eat($codes));
						if (strlen($c) < 2) $c = '0'.$c;
						$col .= $c;
					}
					$col = '#'.$col;
				}
				else {
					$col = FALSE;
				}
				if ($cmd == 38) $attribs['foreground'] = $col;
				if ($cmd == 48) $attribs['background'] = $col;
			}
		}
		
		$style = array();
		if ($attribs['bold']) array_push($style, "font-weight: bold;");
		if ($attribs['dim']) array_push($style, "opacity: 0.5;");
		if ($attribs['underline']) array_push($style, "text-decoration: underline;");
		if ($attribs['blink']) array_push($style, "text-decoration: blink;");
		if ($attribs['invert']) array_push($style, "");
		if ($attribs['hidden']) array_push($style, "visibility: hidden;");
		if ($attribs['foreground']) array_push($style, "color: ".$attribs['foreground'].";");
		if ($attribs['background']) array_push($style, "background: ".$attribs['background'].";");
		
		if ($depth > 0) {
			$insertion .= '</font>';
			$depth--;
		}
		
		if (sizeof($style) > 0) {
			$styleStr = join($style, ' ');
			$insertion = '<font style="'.$styleStr.'">';
			$depth++;
		}
		$html = substr($html, 0, $esc).$insertion.substr($html, $m+1);
	}
	if ($depth > 0) {
		$html .= '</font>';
		$depth--;
	}
	
	return $html;
}

function getFileContentsBash($filePath) {
	return convertBash(file_get_contents($filePath));
}
$dir = scandir("logs", 1);
$fname = "logs/".$dir[0];
$contents = convertBash(htmlspecialchars(file_get_contents($fname)));

?>
<html>
<head>
<style type="text/css">
.terminal {
	display: block;
	background: black;
	border: 2px solid #7F7F7F;
	padding: 4px;
	font-family: monospace;
	white-space: pre;
	color: white;
}
</style>
</head>
<body>
	<div>Log File: <?php echo $fname; ?></div>
	<div><input type="button" onclick="document.location.reload();" value="Refresh"></div>
	<div class="terminal"><?php echo $contents; ?></div>
</body>
<script>
window.addEventListener("load", function(e) {
	setTimeout(function() {
		document.location.reload();
	}, 10000);
});
</script>
</html>