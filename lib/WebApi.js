// URL for dataFile
"use strict";

var hostAddress = null;
var userToken = null;
var pollingTimer = null;

var URL = "lib/WebApi.json";

// image array for status icon
var img_valve_array = [];
img_valve_array[1] = new Image();
img_valve_array[1].src = "img/status Ligado.png";
img_valve_array[1].alt = "Conectado";
img_valve_array[0] = new Image();
img_valve_array[0].src = "img/status Desligado.png";
img_valve_array[0].alt = "Desconectado";

$(document).ready(function() {
	var urlParameter = getUrlParameter();
	var tokenParam = urlParameter["userToken"];
	var hostParam = urlParameter["hostAddress"];

	if (tokenParam && hostParam) {
		userToken = tokenParam;
		hostAddress = hostParam;
		updateWebpage();
	} else {
		$('#plcLoginContainer').show();
		$('#StartWebStatic').hide();
	}

	window.onerror = function(message) {
		if (typeof toastr !== "undefined") {
			toastr.error(message, "Error", { "timeOut": "3000" });
		}
	};
});

function getUrlParameter() {
	var parameter = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(match, key, value) {
		parameter[key] = decodeURIComponent(value);
	});
	return parameter;
}

function showLoginError(msg) {
	var $err = $('#loginErrorMsg');
	if ($err.length) {
		$err.text(msg).fadeIn(200);
	} else {
		alert(msg);
	}
}

function setLoginLoading(isLoading) {
	var $btn = $('#loginBtn');
	if (isLoading) {
		$btn.prop('disabled', true).text('Conectando...');
		$('#loginErrorMsg').hide();
	} else {
		$btn.prop('disabled', false).text('Login');
	}
}

function updateWebpage() {
	$('#plcLoginContainer').hide();
	$('#StartWebStatic').show();

	var query = "?userToken=" + encodeURIComponent(userToken) + "&hostAddress=" + encodeURIComponent(hostAddress);

	if (document.getElementById('cfMa')) {
		document.getElementById('cfMa').setAttribute("href", "StartMaqA.html" + query);
	}
	if (document.getElementById('caMa')) {
		document.getElementById('caMa').setAttribute("href", "SetupEncoderMaqA.html" + query);
	}
	if (document.getElementById('cfMb')) {
		document.getElementById('cfMb').setAttribute("href", "StartMaqB.html" + query);
	}
	if (document.getElementById('caMb')) {
		document.getElementById('caMb').setAttribute("href", "SetupEncoderMaqB.html" + query);
	}
	if (document.getElementById('cfMc')) {
		document.getElementById('cfMc').setAttribute("href", "StartMaqC.html" + query);
	}
	if (document.getElementById('caMc')) {
		document.getElementById('caMc').setAttribute("href", "SetupEncoderMaqC.html" + query);
	}
	if (document.getElementById('cfMd')) {
		document.getElementById('cfMd').setAttribute("href", "StartMaqD.html" + query);
	}
	if (document.getElementById('caMd')) {
		document.getElementById('caMd').setAttribute("href", "SetupEncoderMaqD.html" + query);
	}
	if (document.getElementById('cfBroker')) {
		document.getElementById('cfBroker').setAttribute("href", "SetupBroker.html" + query);
	}
	if (document.getElementById('cfHistProd')) {
		document.getElementById('cfHistProd').setAttribute("href", "HistProd.html" + query);
	}

	// Inicia leitura sem sobrecarregar o CLP
	S7Framework.readData(URL, "init read data", deployValues);
}

function successCallbackLogin(data) {
	setLoginLoading(false);

	var obj = null;
	try {
		obj = typeof data === "string" ? JSON.parse(data) : data;
	} catch (e) {
		showLoginError("Resposta inválida recebida do CLP.");
		return;
	}

	if (obj && obj.result && obj.result.token) {
		userToken = obj.result.token;
		$('#loginErrorMsg').hide();
		updateWebpage();
	} else if (obj && obj.error) {
		var msg = "Usuário ou senha incorretos!";
		if (obj.error.code === 101 || (obj.error.message && obj.error.message.toLowerCase().indexOf("resource") !== -1)) {
			msg = "Limite de sessões atingido no CLP. Aguarde alguns segundos e tente novamente.";
		} else if (obj.error.message && obj.error.code !== 100) {
			msg = "Erro de login (" + obj.error.code + "): " + obj.error.message;
		}
		showLoginError(msg);
		$('#webServerUserpassword').val('').focus();
	} else {
		showLoginError("Não foi possível autenticar no CLP. Verifique usuário e senha.");
	}
}

function errorCallbackLogin(jqXHR, textStatus) {
	setLoginLoading(false);

	if (textStatus === "timeout") {
		showLoginError("Tempo de conexão esgotado! Verifique se o IP (" + hostAddress + ") está correto e acessível na rede.");
	} else {
		showLoginError("Falha ao conectar ao CLP (" + hostAddress + "). Verifique o endereço IP, a conexão de rede ou aceite o certificado HTTPS no navegador.");
	}
}

function login() {
	// Sempre lê o valor atual digitado no campo de IP
	hostAddress = $.trim($('#plcIpAdress').val());
	var username = $.trim($('#webServerUserName').val());
	var password = $('#webServerUserpassword').val();

	if (!hostAddress) {
		showLoginError("Informe o endereço IP do CLP.");
		$('#plcIpAdress').focus();
		return;
	}

	if (!username) {
		showLoginError("Informe o nome de usuário.");
		$('#webServerUserName').focus();
		return;
	}

	var request = {
		id: "888",
		jsonrpc: "2.0",
		method: "Api.Login",
		params: {
			user: username,
			password: password || ''
		}
	};

	setLoginLoading(true);
	postJsonRPC(hostAddress, request, userToken, successCallbackLogin, errorCallbackLogin);
}

if (typeof toastr !== "undefined") {
	toastr.options = {
		"closeButton": true,
		"debug": false,
		"newestOnTop": false,
		"progressBar": false,
		"positionClass": "toast-top-right",
		"preventDuplicates": true,
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "5000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	};
}

function postJsonRPC(host, request, token, successCallback, errorCallBack) {
	if (host && request && (token || (request.method && request.method.toLowerCase().indexOf('api.login') !== -1))) {
		var api = "https://" + host + "/api/jsonrpc";

		$.ajax({
			type: "POST",
			url: api,
			timeout: 8000,
			headers: token ? { 'X-Auth-Token': token } : {},
			data: JSON.stringify(request),
			dataType: "text",
			contentType: "application/json",
			success: function(data, textStatus, jqXHR) {
				if (successCallback) {
					successCallback(data, textStatus, jqXHR);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorCallBack) {
					errorCallBack(jqXHR, textStatus, errorThrown);
				} else {
					showLoginError("Erro na comunicação com o CLP. Verifique o console do navegador.");
					console.error(errorThrown);
				}
			}
		});
	} else {
		if (!host) {
			showLoginError("Informe o endereço IP do CLP.");
		} else if (!request || !request.method) {
			showLoginError("Endpoint da API inválido.");
		}
	}
}

function setStatusIcon(selector, isConnected) {
	var idx = isConnected ? 1 : 0;
	$(selector).attr({
		src: img_valve_array[idx].src,
		title: img_valve_array[idx].alt,
		alt: img_valve_array[idx].alt
	});
}

function deployValues(values) {
	if (values && values.length >= 8) {
		setStatusIcon('#statusBroMqA', values[0]);
		setStatusIcon('#statusBroMqB', values[1]);
		setStatusIcon('#statusMbMqA',  values[2]);
		setStatusIcon('#statusMbMqB',  values[3]);
		setStatusIcon('#statusBroMqC', values[4]);
		setStatusIcon('#statusMbMqC',  values[5]);
		setStatusIcon('#statusBroMqD', values[6]);
		setStatusIcon('#statusMbMqD',  values[7]);
	}

	// Leitura cíclica correta: aguarda 2 segundos reais após o término da leitura anterior
	if (pollingTimer) {
		clearTimeout(pollingTimer);
	}
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}
