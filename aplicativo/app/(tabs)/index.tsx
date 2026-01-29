import { Audio } from "expo-av";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldVibrate: true,
  }),
});

export default function HomeScreen() {
  const [senha, setSenha] = useState("");
  const [som, setSom] = useState();
  const notificationListener = useRef();

  useEffect(() => {
    configurarNotificacoes();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        tocarSirene();
        Vibration.vibrate([0, 500, 500, 500], true);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
    };
  }, []);

  async function configurarNotificacoes() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      try {
        const token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
          })
        ).data;

        console.log("TOKEN DO DISPOSITIVO:", token);
        Alert.alert("TOKEN PARA O SERVIDOR", token);
      } catch (error) {
        Alert.alert("Erro ao gerar Token", error.message);
      }
    } else {
      Alert.alert(
        "Aviso",
        "Use um dispositivo real para receber notificações.",
      );
    }
  }

  async function tocarSirene() {
    try {
      const { sound } = await Audio.Sound.createAsync(require("./sirene.mp3"));
      setSom(sound);
      await sound.setIsLoopingAsync(true);
      await sound.playAsync();
    } catch (e) {
      console.log("Erro ao tocar som:", e);
    }
  }

  async function pararAlertas() {
    Vibration.cancel();
    if (som) {
      await som.stopAsync();
      await som.unloadAsync();
      setSom(undefined);
    }
  }

  const confirmarPresenca = async () => {
    try {
      const res = await fetch(
        "https://projetovigilia-production.up.railway.app/checkin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha }),
        },
      );
      if (res.ok) {
        Alert.alert("Sucesso", "✅ Log registrado!");
        setSenha("");
        pararAlertas();
      } else {
        Alert.alert("Erro", "Senha incorreta.");
      }
    } catch (error) {
      Alert.alert("Erro de conexão", "Verifique o servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.titulo}>🔒 VIGILIA CONECTADA</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Senha"
        onChangeText={setSenha}
        value={senha}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.botao} onPress={confirmarPresenca}>
        <Text style={styles.textoBotao}>CONFIRMAR AGORA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: { width: 120, height: 120, marginBottom: 20 },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 20 },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
  },
  botao: {
    width: "100%",
    height: 60,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotao: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
